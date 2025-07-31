import { useEffect, useState } from "react";
import {
  fetchBalances,
  fetchOrderBook,
  fetchMarketsWithDetails,
} from "../services/Services";
import { Coin } from "@injectivelabs/sdk-ts";
import { msgBroadcaster } from "../services/MsgBroadcaster";
import { makeMsgCreateSpotLimitOrder } from "../services/Transactions";
import { BigNumber } from "@injectivelabs/utils";
import { WalletSelector } from "./WalletSelector";

interface Market {
  marketId: string;
  ticker: string;
  baseDenom: string;
  quoteDenom: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseDecimals: number;
  quoteDecimals: number;
  minPriceTickSize: string;
  minQuantityTickSize: string;
  status: string;
  price?: string;
  priceTensMultiplier: string;
  quantityTensMultiplier: string;
}

interface OrderBookEntry {
  price: string;
  size: string;
  total: string;
}

export function Dex() {
  const [address, setAddress] = useState<string>("");
  const [spotMarkets, setSpotMarkets] = useState<Market[]>([]);
  const [balances, setBalances] = useState<Coin[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [orderBook, setOrderBook] = useState<{
    buys: OrderBookEntry[];
    sells: OrderBookEntry[];
  }>({ buys: [], sells: [] });
  const [lastTxHash, setLastTxHash] = useState<string>("");

  // 处理钱包连接成功
  const handleWalletConnected = async (walletAddress: string) => {
    setAddress(walletAddress);

    // 确保使用正确的Injective地址格式
    let injectiveAddress = walletAddress;
    if (walletAddress.startsWith("0x")) {
      // 如果是MetaMask地址，转换为Injective地址
      const { getInjectiveAddress } = await import("@injectivelabs/sdk-ts");
      injectiveAddress = getInjectiveAddress(walletAddress);
      console.log(
        "转换MetaMask地址为Injective地址:",
        walletAddress,
        "->",
        injectiveAddress
      );
    }

    // 获取钱包余额
    try {
      const { balances: walletBalances } = await fetchBalances(
        injectiveAddress
      );
      console.log("walletBalances", walletBalances);
      setBalances(walletBalances);
    } catch (error) {
      console.error("获取余额失败:", error);
      // 即使获取余额失败，也不影响其他功能
    }

    // 触发自定义事件通知其他组件
    window.dispatchEvent(
      new CustomEvent("walletConnected", { detail: walletAddress })
    );
  };

  const loadMarkets = async () => {
    try {
      const marketsWithSymbols = await fetchMarketsWithDetails();
      setSpotMarkets(marketsWithSymbols);
    } catch (error) {
      console.error("Error loading markets:", error);
    }
  };

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadOrderBook = async (market: Market) => {
    try {
      const { buys, sells, currentPrice } = await fetchOrderBook(market);

      setOrderBook({ buys, sells });
      setSelectedMarket({
        ...market,
        price: currentPrice,
      });
    } catch (error) {
      console.error("Error loading orderbook:", error);
    }
  };

  const createSpotOrder = async (
    market: Market,
    price: string,
    quantity: string,
    orderType: number
  ) => {
    try {
      console.log("quantity", quantity);
      const adjustedQuantity = new BigNumber(quantity)
        .shiftedBy(
          market.baseDecimals + (market.baseDecimals - market.quoteDecimals)
        )
        .toString();
      console.log("adjustedQuantity", adjustedQuantity);

      const msg = makeMsgCreateSpotLimitOrder(
        price,
        adjustedQuantity,
        orderType,
        address,
        {
          ...market,
          priceTensMultiplier: Number(market.priceTensMultiplier),
          quantityTensMultiplier: Number(market.quantityTensMultiplier),
          baseDecimals: market.baseDecimals,
          quoteDecimals: market.quoteDecimals,
        }
      );

      console.log("Creating order with:", {
        price,
        quantity: adjustedQuantity,
        baseDecimals: market.baseDecimals,
        originalQuantity: quantity,
      });

      const response = await msgBroadcaster.broadcast({
        msgs: [msg],
        injectiveAddress: address,
      });

      console.log("Order created:", response);
      setLastTxHash(response.txHash);

      // 交易成功后重新加载订单簿
      if (selectedMarket) {
        await loadOrderBook(selectedMarket);
      }
    } catch (error) {
      console.error("Error creating spot order:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Injective DEX
          </h1>
          <p className="text-gray-600 text-lg">
            Decentralized Exchange on Injective
          </p>
        </div>

        {!address ? (
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-600">
                  Connect your Injective wallet to start trading
                </p>
              </div>
              {/* 替换原来的连接按钮为 WalletSelector 组件 */}
              <WalletSelector onWalletConnected={handleWalletConnected} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">
                      Connected Wallet
                    </h2>
                    <p className="text-sm text-gray-500 font-mono">{address}</p>
                  </div>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {balances.map((balance) => {
                  // 处理长地址显示
                  const formatDenom = (denom: string) => {
                    if (denom.startsWith("peggy0x") && denom.length > 20) {
                      return `${denom.substring(0, 10)}...${denom.substring(
                        denom.length - 8
                      )}`;
                    }
                    return denom;
                  };

                  return (
                    <div
                      key={balance.denom}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow group relative"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="relative">
                            <p
                              className="font-semibold text-gray-800 text-lg truncate"
                              title={balance.denom}
                            >
                              {formatDenom(balance.denom)}
                            </p>
                            {/* 悬停时显示完整地址 */}
                            {balance.denom.startsWith("peggy0x") && (
                              <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 max-w-xs break-all">
                                <div className="font-mono">{balance.denom}</div>
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Balance:{" "}
                            {parseFloat(balance.amount) / Math.pow(10, 18)}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                          <span className="text-white text-xs font-bold">
                            $
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Markets Section */}
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
                  Spot Markets
                </h2>
              </div>

              {/* Market Selector */}
              <div className="flex gap-3 mb-6 flex-wrap">
                {spotMarkets.map((market) => (
                  <button
                    key={market.marketId}
                    onClick={() => loadOrderBook(market)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                      selectedMarket?.marketId === market.marketId
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    }`}
                  >
                    {market.ticker}
                  </button>
                ))}
              </div>

              {/* Orderbook Display */}
              {selectedMarket && (
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-2xl border border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold">
                        {selectedMarket.ticker} Orderbook
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Current Price</div>
                      <div className="text-lg font-bold text-green-400">
                        {selectedMarket.price}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-4 text-gray-400 font-medium">
                    <span>Price ({selectedMarket.quoteSymbol})</span>
                    <span className="text-center">
                      Size ({selectedMarket.baseSymbol})
                    </span>
                    <span className="text-right">
                      Total ({selectedMarket.quoteSymbol})
                    </span>
                  </div>

                  {/* Sell Orders */}
                  <div className="mb-4 max-h-[200px] overflow-y-auto">
                    {orderBook.sells
                      .slice()
                      .reverse()
                      .slice(-3)
                      .map((sell, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-3 gap-4 text-red-400 mb-2 hover:bg-gray-800 py-2 px-3 rounded-lg transition-colors"
                        >
                          <span className="text-right font-mono">
                            {sell.price}
                          </span>
                          <span className="text-center font-mono">
                            {sell.size}
                          </span>
                          <span className="text-right font-mono">
                            {sell.total}
                          </span>
                        </div>
                      ))}
                  </div>

                  {/* Current Price */}
                  <div className="text-center py-4 border-y border-gray-700 my-4">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {selectedMarket.price}
                    </div>
                    <div className="text-sm text-gray-400">
                      ≈ {selectedMarket.quoteSymbol}
                    </div>
                  </div>

                  {/* Buy Orders */}
                  <div className="mb-6 max-h-[200px] overflow-y-auto">
                    {orderBook.buys.slice(0, 3).map((buy, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-3 gap-4 text-green-400 mb-2 hover:bg-gray-800 py-2 px-3 rounded-lg transition-colors"
                      >
                        <span className="text-right font-mono">
                          {buy.price}
                        </span>
                        <span className="text-center font-mono">
                          {buy.size}
                        </span>
                        <span className="text-right font-mono">
                          {buy.total}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Trading Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() =>
                        createSpotOrder(
                          selectedMarket,
                          selectedMarket.price || "0",
                          "1",
                          2
                        )
                      }
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Sell 1 {selectedMarket.baseSymbol}
                    </button>
                    <button
                      onClick={() =>
                        createSpotOrder(
                          selectedMarket,
                          selectedMarket.price || "0",
                          "1",
                          1
                        )
                      }
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      Buy 1 {selectedMarket.baseSymbol}
                    </button>
                  </div>

                  {/* Transaction Hash Display */}
                  {lastTxHash && (
                    <div className="mt-6 p-4 bg-gray-800 rounded-xl border border-gray-700">
                      <div className="text-sm text-gray-400 mb-2">
                        Latest Transaction:
                      </div>
                      <a
                        href={`https://testnet.explorer.injective.network/transaction/${lastTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 break-all text-sm font-mono"
                      >
                        {lastTxHash}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
