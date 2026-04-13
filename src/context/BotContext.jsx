import { createContext, useContext, useState } from "react";

const BotContext = createContext();

export const BotProvider = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [interval, setInterval] = useState("1m");
  const [tradeAmount, setTradeAmount] = useState(0.1);
  const [takeProfitAmount, setTakeProfitAmount] = useState(1);
  const [stopLossAmount, setStopLossAmount] = useState(0.5);
  const [stopLossConsecutive, setStopLossConsecutive] = useState(3);
  const [totalPnL, setTotalPnL] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [totalLost, setTotalLost] = useState(0);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [botStopReason, setBotStopReason] = useState(null);

  const resetBot = () => {
    setTotalPnL(0);
    setConsecutiveLosses(0);
    setTotalLost(0);
    setTradeHistory([]);
    setBotStopReason(null);
  };

  const addTrade = (trade) => {
    setTradeHistory((prev) => [trade, ...prev]);

    if (trade.pnl < 0) {
      const loss = Math.abs(trade.pnl);
      setTotalLost((prev) => prev + loss);
      setConsecutiveLosses((prev) => prev + 1);
    } else {
      setConsecutiveLosses(0);
    }

    setTotalPnL((prev) => prev + trade.pnl);
  };

  return (
    <BotContext.Provider
      value={{
        isRunning, setIsRunning,
        interval, setInterval,
        tradeAmount, setTradeAmount,
        takeProfitAmount, setTakeProfitAmount,
        stopLossAmount, setStopLossAmount,
        stopLossConsecutive, setStopLossConsecutive,
        totalPnL, consecutiveLosses,
        totalLost, tradeHistory,
        botStopReason, setBotStopReason,
        addTrade, resetBot,
      }}
    >
      {children}
    </BotContext.Provider>
  );
};

export const useBot = () => useContext(BotContext);