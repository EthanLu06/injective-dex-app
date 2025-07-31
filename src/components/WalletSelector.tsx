import React, { useState } from "react";
import {
  WalletType,
  connectWallet,
  disconnectWallet,
} from "../services/Wallet";

interface WalletSelectorProps {
  onWalletConnected: (address: string) => void;
}

export const WalletSelector: React.FC<WalletSelectorProps> = ({
  onWalletConnected,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (walletType: WalletType) => {
    try {
      setConnecting(true);
      setError(null);

      const address = await connectWallet(walletType);
      if (address) {
        onWalletConnected(address);
        setIsModalOpen(false);
      } else {
        setError(
          `无法连接到${
            walletType === WalletType.Keplr ? "Keplr" : "MetaMask"
          }钱包`
        );
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError("连接钱包时出错");
    } finally {
      setConnecting(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={openModal}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        连接钱包
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">选择钱包</h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={() => handleConnect(WalletType.Keplr)}
                disabled={connecting}
                className="w-full flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 px-4 py-4 rounded-xl border border-blue-200 transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <img
                      src="https://keplr.app/android-chrome-192x192.png"
                      alt="Keplr Logo"
                      className="w-7 h-7"
                    />
                  </div>
                  <span className="font-medium text-gray-800">Keplr 钱包</span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <button
                onClick={() => handleConnect(WalletType.MetaMask)}
                disabled={connecting}
                className="w-full flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 px-4 py-4 rounded-xl border border-orange-200 transition-all duration-200"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                      alt="MetaMask Logo"
                      className="w-7 h-7"
                    />
                  </div>
                  <span className="font-medium text-gray-800">
                    MetaMask 钱包
                  </span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {connecting && (
              <div className="flex justify-center mt-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
