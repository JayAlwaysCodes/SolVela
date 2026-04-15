import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const WalletConnect = () => {
  const { publicKey, connected } = useWallet();

  return (
    <div className="flex items-center gap-3">
      <WalletMultiButton className="!bg-secondary hover:!bg-purple-700 !rounded-xl !text-sm !font-semibold !py-2 !px-4" />
      {connected && (
        <span className="text-xs text-gray-400">
          {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
        </span>
      )}
    </div>
  );
};

export default WalletConnect;