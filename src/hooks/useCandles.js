import { useState, useCallback } from "react";
import axios from "axios";

// SOL mint address on Solana mainnet
const SOL_MINT = "So11111111111111111111111111111111111111112";
const BIRDEYE_API_KEY = import.meta.env.VITE_BIRDEYE_API_KEY;

// Map our interval labels to Birdeye's expected values
const intervalMap = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1H",
  "4h": "4H",
  "1D": "1D",
};

export const useCandles = () => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCandles = useCallback(async (interval = "1m") => {
    setLoading(true);
    setError(null);

    try {
      const now = Math.floor(Date.now() / 1000);
      const timeBack = 100; // fetch last 100 candles

      // Calculate time_from based on interval
      const intervalSeconds = {
        "1m": 60,
        "5m": 300,
        "15m": 900,
        "1h": 3600,
        "4h": 14400,
        "1D": 86400,
      };

      const timeFrom = now - intervalSeconds[interval] * timeBack;
      const birdeyeInterval = intervalMap[interval];

      const response = await axios.get(
        `https://public-api.birdeye.so/defi/ohlcv`,
        {
          headers: {
            "X-API-KEY": BIRDEYE_API_KEY,
            "x-chain": "solana",
          },
          params: {
            address: SOL_MINT,
            type: birdeyeInterval,
            time_from: timeFrom,
            time_to: now,
          },
        }
      );

      const items = response.data?.data?.items;

      if (!items || items.length === 0) {
        setError("No candle data returned");
        setLoading(false);
        return [];
      }

      // Normalize candle format
      const formatted = items.map((c) => ({
        time: c.unixTime,
        open: c.o,
        high: c.h,
        low: c.l,
        close: c.c,
        volume: c.v,
      }));

      setCandles(formatted);
      setLoading(false);
      return formatted;

    } catch (err) {
      console.error("Candle fetch error:", err);
      setError("Failed to fetch candle data");
      setLoading(false);
      return [];
    }
  }, []);

  // Returns the last fully closed candle (second to last)
  const getPreviousCandle = useCallback((candleList) => {
    if (!candleList || candleList.length < 2) return null;
    return candleList[candleList.length - 2];
  }, []);

  return { candles, loading, error, fetchCandles, getPreviousCandle };
};