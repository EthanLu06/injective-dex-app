import React, { useEffect, useState } from "react";
import {
  getCount,
  incrementCounter,
  resetCounter,
} from "../services/CosmwasmClient";

interface CounterProps {
  address: string;
}

export const Counter: React.FC<CounterProps> = ({ address }) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchCount = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentCount = await getCount();
      setCount(currentCount);
    } catch (err) {
      console.error("Error fetching count:", err);
      setError("Failed to fetch counter value");
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async () => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      const hash = await incrementCounter(address);
      setTxHash(hash);
      // Refetch count after transaction
      await fetchCount();
    } catch (err) {
      console.error("Error incrementing counter:", err);
      setError("Failed to increment counter");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (newCount: number) => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);
      const hash = await resetCounter(address, newCount);
      setTxHash(hash);
      // Refetch count after transaction
      await fetchCount();
    } catch (err) {
      console.error("Error resetting counter:", err);
      setError("Failed to reset counter");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchCount();
    }
  }, [address]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800">
          Smart Contract Counter
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {count !== null ? count : "..."}
          </div>
          <div className="text-gray-500 mt-2">Current Counter Value</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-4">
        <button
          onClick={handleIncrement}
          disabled={loading}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50"
        >
          Increment
        </button>
        <button
          onClick={() => handleReset(0)}
          disabled={loading}
          className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50"
        >
          Reset to 0
        </button>
      </div>

      {txHash && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Latest Transaction:</div>
          <a
            href={`https://testnet.explorer.injective.network/transaction/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 break-all text-sm font-mono"
          >
            {txHash}
          </a>
        </div>
      )}
    </div>
  );
};
