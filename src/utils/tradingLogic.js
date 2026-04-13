// Determine action based on previous candle
export const getSignal = (previousCandle) => {
  if (!previousCandle) return null;
  const { open, close } = previousCandle;
  if (close > open) return "BUY";
  if (open > close) return "SELL";
  return null;
};

// Check if SL conditions are met
export const checkStopLoss = (totalLost, consecutiveLosses, slAmount, slConsecutive) => {
  if (totalLost >= slAmount) return { hit: true, reason: `Stop loss hit: Lost ${totalLost.toFixed(4)} SOL/USDC` };
  if (consecutiveLosses >= slConsecutive) return { hit: true, reason: `Stop loss hit: ${consecutiveLosses} consecutive losses` };
  return { hit: false };
};

// Check if TP condition is met
export const checkTakeProfit = (totalPnL, tpAmount) => {
  if (totalPnL >= tpAmount) return { hit: true, reason: `Take profit hit: Gained ${totalPnL.toFixed(4)} SOL/USDC` };
  return { hit: false };
};

// Format candle interval to milliseconds
export const intervalToMs = (interval) => {
  const map = {
    "1m": 60000,
    "5m": 300000,
    "15m": 900000,
    "1h": 3600000,
    "4h": 14400000,
    "1D": 86400000,
  };
  return map[interval] || 60000;
};