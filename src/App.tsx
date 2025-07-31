import { Dex } from "./components/Dex";
import { Counter } from "./components/Counter";
import { useState, useEffect } from "react";
import { walletStrategy } from "./services/Wallet";

function App() {
  const [address, setAddress] = useState<string>("");

  // Check if wallet is already connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const addresses = await walletStrategy.getAddresses();
        if (addresses.length > 0) {
          setAddress(addresses[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    checkWalletConnection();

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
