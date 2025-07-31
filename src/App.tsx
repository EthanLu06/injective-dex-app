import { Dex } from "./components/Dex";
import { Counter } from "./components/Counter";
import { useState, useEffect } from "react";
import { walletStrategy } from "./services/Wallet";

function App() {
  const [address, setAddress] = useState<string>("");

  // 移除自动检查钱包连接，让用户手动选择钱包
  useEffect(() => {
    // 不再自动连接钱包，等待用户手动选择

    // Listen for wallet connection events
    const handleWalletConnected = (e: CustomEvent) => {
      setAddress(e.detail);
    };

    window.addEventListener(
      "walletConnected",
      handleWalletConnected as EventListener
    );

    return () => {
      window.removeEventListener(
        "walletConnected",
        handleWalletConnected as EventListener
      );
    };
  }, []);

  return (
    <div className="min-h-screen w-full">
      <Dex />
      {address && (
        <div className="max-w-6xl mx-auto p-6 mt-8">
          <Counter address={address} />
        </div>
      )}
    </div>
  );
}

export default App;
