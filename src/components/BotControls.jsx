import { useBot } from "../context/BotContext";
import { useBotEngine } from "../hooks/useBot";
import { useWallet } from "@solana/wallet-adapter-react";

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1D"];

const BotControls = () => {
  const wallet = useWallet();
  const {
    isRunning,
    interval, setInterval,
    tradeAmount, setTradeAmount,
    takeProfitAmount, setTakeProfitAmount,
    stopLossAmount, setStopLossAmount,
    stopLossConsecutive, setStopLossConsecutive,
  } = useBot();

  const { startBot, stopBot, status, currentSignal } = useBotEngine(wallet);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
      <h2 className="text-lg font-bold text-white">Bot Configuration</h2>

      {/* Candle Interval */}
      <div>
        <label className="text-sm text-gray-400 mb-2 block">Candle Interval</label>
        <div className="flex gap-2 flex-wrap">
          {INTERVALS.map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${interval === i
                  ? "bg-primary text-black"
                  : "bg-border text-gray-300 hover:bg-gray-600"
                } disabled:opacity-50`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Trade Amount */}
      <div>
        <label className="text-sm text-gray-400 mb-1 block">
          Trade Amount (SOL/USDC per order)
        </label>
        <input
          type="number"
          value={tradeAmount}
          onChange={(e) => setTradeAmount(Number(e.target.value))}
          disabled={isRunning}
          min="0.01"
          step="0.01"
          className="w-full bg-dark border border-border rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-primary disabled:opacity-50"
        />
      </div>

      {/* Take Profit */}
      <div>
        <label className="text-sm text-gray-400 mb-1 block">
          Take Profit (stop when gained this amount)
        </label>
        <input
          type="number"
          value={takeProfitAmount}
          onChange={(e) => setTakeProfitAmount(Number(e.target.value))}
          disabled={isRunning}
          min="0.01"
          step="0.01"
          className="w-full bg-dark border border-border rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-primary disabled:opacity-50"
        />
      </div>

      {/* Stop Loss Amount */}
      <div>
        <label className="text-sm text-gray-400 mb-1 block">
          Stop Loss — Max Loss Amount
        </label>
        <input
          type="number"
          value={stopLossAmount}
          onChange={(e) => setStopLossAmount(Number(e.target.value))}
          disabled={isRunning}
          min="0.01"
          step="0.01"
          className="w-full bg-dark border border-border rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-primary disabled:opacity-50"
        />
      </div>

      {/* Stop Loss Consecutive */}
      <div>
        <label className="text-sm text-gray-400 mb-1 block">
          Stop Loss — Max Consecutive Losses
        </label>
        <input
          type="number"
          value={stopLossConsecutive}
          onChange={(e) => setStopLossConsecutive(Number(e.target.value))}
          disabled={isRunning}
          min="1"
          step="1"
          className="w-full bg-dark border border-border rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-primary disabled:opacity-50"
        />
      </div>

      {/* Status */}
      <div className="bg-dark rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">Status</span>
        <span className={`text-xs font-medium ${
          isRunning ? "text-primary" : "text-gray-400"
        }`}>
          {status}
        </span>
      </div>

      {/* Signal */}
      {currentSignal && (
        <div className="bg-dark rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">Last Signal</span>
          <span className={`text-sm font-bold ${
            currentSignal === "BUY" ? "text-primary" : "text-red-400"
          }`}>
            {currentSignal}
          </span>
        </div>
      )}

      {/* Start/Stop Button */}
      <button
        onClick={isRunning ? () => stopBot("Manually stopped") : startBot}
        disabled={!wallet.connected}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all
          ${isRunning
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-primary hover:bg-green-400 text-black"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {!wallet.connected
          ? "Connect Wallet to Start"
          : isRunning
          ? "⏹ Stop Bot"
          : "▶ Start Bot"}
      </button>
    </div>
  );
};

export default BotControls;