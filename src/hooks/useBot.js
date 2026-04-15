import { useState, useRef, useCallback } from "react";
import { useBot as useBotContext } from "../context/BotContext";
import { useCandles } from "./useCandles";
import {
  getSignal,
  checkStopLoss,
  checkTakeProfit,
  intervalToMs,
} from "../utils/tradingLogic";
import {
  getSwapQuote,
  getSwapTransaction,
  executeSwap,
  solToLamports,
  usdcToBase,
  SOL_MINT,
  USDC_MINT,
} from "../utils/dflow";

export const useBotEngine = (wallet) => {
  const botTimerRef = useRef(null);
  const isRunningRef = useRef(false);
  const [status, setStatus] = useState("idle");
  const [currentSignal, setCurrentSignal] = useState(null);

  const {
    interval,
    tradeAmount,
    takeProfitAmount,
    stopLossAmount,
    stopLossConsecutive,
    totalPnL,
    consecutiveLosses,
    totalLost,
    setIsRunning,
    setBotStopReason,
    addTrade,
    resetBot,
  } = useBotContext();

  const { fetchCandles, getPreviousCandle } = useCandles();

  const stopBot = useCallback((reason) => {
    if (botTimerRef.current) {
      clearInterval(botTimerRef.current);
      botTimerRef.current = null;
    }
    isRunningRef.current = false;
    setIsRunning(false);
    setStatus("stopped");
    setBotStopReason(reason);
    console.log("Bot stopped:", reason);
  }, [setIsRunning, setBotStopReason]);

  const executeTrade = useCallback(async (signal, currentTotalPnL, currentTotalLost, currentConsecutiveLosses) => {
    if (!wallet?.publicKey) {
      setStatus("error: wallet not connected");
      return;
    }

    try {
      setStatus(`executing ${signal}...`);

      // Determine input/output mints based on signal
      const inputMint = signal === "BUY" ? USDC_MINT : SOL_MINT;
      const outputMint = signal === "BUY" ? SOL_MINT : USDC_MINT;

      // Convert amount based on signal
      const amount = signal === "BUY"
        ? usdcToBase(tradeAmount)
        : solToLamports(tradeAmount);

      // Get quote
      const quote = await getSwapQuote(inputMint, outputMint, amount);

      // Get swap transaction
      const swapTx = await getSwapTransaction(quote, wallet.publicKey);

      // Execute swap
      const txid = await executeSwap(swapTx, wallet);

      // Calculate PnL (simplified — difference in out amount vs in amount)
      const outAmount = Number(quote.outAmount);
      const inAmount = Number(quote.inAmount);
      const pnl = signal === "BUY"
        ? (outAmount / 1e9) - tradeAmount
        : (outAmount / 1e6) - tradeAmount;

      const trade = {
        signal,
        txid,
        amount: tradeAmount,
        pnl,
        timestamp: Date.now(),
      };

      addTrade(trade);

      // Check SL/TP after trade using updated values
      const newTotalPnL = currentTotalPnL + pnl;
      const newTotalLost = pnl < 0 ? currentTotalLost + Math.abs(pnl) : currentTotalLost;
      const newConsecutiveLosses = pnl < 0 ? currentConsecutiveLosses + 1 : 0;

      const slCheck = checkStopLoss(newTotalLost, newConsecutiveLosses, stopLossAmount, stopLossConsecutive);
      if (slCheck.hit) {
        stopBot(slCheck.reason);
        return;
      }

      const tpCheck = checkTakeProfit(newTotalPnL, takeProfitAmount);
      if (tpCheck.hit) {
        stopBot(tpCheck.reason);
        return;
      }

      setStatus(`last: ${signal} ✓ | tx: ${txid.slice(0, 8)}...`);

    } catch (err) {
      console.error("Trade execution error:", err);
      setStatus(`error: ${err.message}`);
    }
  }, [wallet, tradeAmount, stopLossAmount, stopLossConsecutive, takeProfitAmount, addTrade, stopBot]);

  const runBotCycle = useCallback(async () => {
    if (!isRunningRef.current) return;

    try {
      setStatus("fetching candles...");
      const candles = await fetchCandles(interval);
      const previousCandle = getPreviousCandle(candles);

      if (!previousCandle) {
        setStatus("waiting for candle data...");
        return;
      }

      const signal = getSignal(previousCandle);
      setCurrentSignal(signal);

      if (!signal) {
        setStatus("no signal — candle open equals close");
        return;
      }

      await executeTrade(signal, totalPnL, totalLost, consecutiveLosses);

    } catch (err) {
      console.error("Bot cycle error:", err);
      setStatus(`cycle error: ${err.message}`);
    }
  }, [interval, fetchCandles, getPreviousCandle, executeTrade, totalPnL, totalLost, consecutiveLosses]);

  const startBot = useCallback(() => {
    if (!wallet?.publicKey) {
      setStatus("error: connect wallet first");
      return;
    }

    resetBot();
    isRunningRef.current = true;
    setIsRunning(true);
    setStatus("running");
    setBotStopReason(null);

    // Run immediately then on interval
    runBotCycle();
    botTimerRef.current = setInterval(runBotCycle, intervalToMs(interval));
  }, [wallet, interval, resetBot, setIsRunning, setBotStopReason, runBotCycle]);

  return {
    startBot,
    stopBot,
    status,
    currentSignal,
  };
};