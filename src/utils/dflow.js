import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";

const HELIUS_RPC = import.meta.env.VITE_HELIUS_RPC_URL;

// SOL and USDC mint addresses
export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Get connection
export const getConnection = () => new Connection(HELIUS_RPC, "confirmed");

// Fetch swap quote from Jupiter (DFlow uses Jupiter routing)
export const getSwapQuote = async (inputMint, outputMint, amount, slippageBps = 50) => {
  try {
    const response = await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&dflow=true`
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (err) {
    console.error("Quote error:", err);
    throw err;
  }
};

// Get swap transaction from Jupiter
export const getSwapTransaction = async (quoteResponse, walletPublicKey) => {
  try {
    const response = await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: walletPublicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data.swapTransaction;
  } catch (err) {
    console.error("Swap transaction error:", err);
    throw err;
  }
};

// Execute the swap
export const executeSwap = async (swapTransaction, wallet) => {
  try {
    const connection = getConnection();

    // Deserialize transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // Sign with wallet
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send transaction
    const rawTransaction = signedTransaction.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 3,
    });

    // Confirm transaction
    const confirmation = await connection.confirmTransaction(txid, "confirmed");
    if (confirmation.value.err) throw new Error("Transaction failed");

    return txid;
  } catch (err) {
    console.error("Execute swap error:", err);
    throw err;
  }
};

// Convert SOL amount to lamports
export const solToLamports = (sol) => Math.floor(sol * 1e9);

// Convert USDC amount to base units
export const usdcToBase = (usdc) => Math.floor(usdc * 1e6);