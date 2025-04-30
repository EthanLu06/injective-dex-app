import React, { useEffect, useState } from 'react'
import { walletStrategy } from '../services/Wallet'
import { msgBroadcaster } from '../services/MsgBroadcaster'
import {
  fetchSpotMarkets,
  indexerSpotApi,
} from '../services/Services'
import { makeMsgCreateSpotLimitOrder } from '../services/Transactions'
import { SpotMarket, Coin } from '@injectivelabs/sdk-ts'
import { fetchBalances } from '../services/Services'

interface Market {
  marketId: string
  ticker: string
  baseDenom: string
  quoteDenom: string
  baseSymbol: string
  quoteSymbol: string
  baseDecimals: number
  quoteDecimals: number
  minPriceTickSize: string
  minQuantityTickSize: string
  status: string
  price?: string
}

interface OrderBookEntry {
  price: string
  size: string
  total: string
}

export const Dex: React.FC = () => {
  const [address, setAddress] = useState<string>('')
  const [spotMarkets, setSpotMarkets] = useState<Market[]>([])
  const [balances, setBalances] = useState<Coin[]>([])
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [orderBook, setOrderBook] = useState<{
    buys: OrderBookEntry[]
    sells: OrderBookEntry[]
  }>({ buys: [], sells: [] })

  const connectWallet = async () => {
    try {
      const addresses = await walletStrategy.getAddresses()
      if (addresses.length > 0) {
        setAddress(addresses[0])
        // 获取钱包余额
        const { balances: walletBalances } = await fetchBalances(addresses[0])
        console.log('walletBalances', walletBalances)
        setBalances(walletBalances)
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const formatPrice = (price: string, baseDecimals: number, quoteDecimals: number) => {
    const priceNum = Number(price)
    if (isNaN(priceNum)) return '0.000'
    // 计算实际价格：basePrice * (10^quoteDecimals / 10^baseDecimals)
    const priceFactor = Math.pow(10, quoteDecimals) / Math.pow(10, baseDecimals)
    return (priceNum * priceFactor).toFixed(3)
  }

  const formatQuantity = (quantity: string) => {
    const num = Number(quantity)
    return isNaN(num) ? '0.000' : num.toFixed(3)
  }

  const loadMarkets = async () => {
    try {
      const spot = await fetchSpotMarkets()
      
      // 只获取基本市场信息，不查询订单簿
      const marketsWithSymbols = spot.slice(0, 10).map((market: SpotMarket) => {
        const [baseSymbol, quoteSymbol] = market.ticker.split('/')
        
        // 获取代币精度，如果未定义则使用默认值
        const baseDecimals = market.baseToken?.decimals || 18
        const quoteDecimals = market.quoteToken?.decimals || 6
        
        return {
          marketId: market.marketId,
          ticker: market.ticker,
          baseDenom: market.baseDenom,
          quoteDenom: market.quoteDenom,
          baseSymbol,
          quoteSymbol,
          baseDecimals,
          quoteDecimals,
          minPriceTickSize: market.minPriceTickSize.toString(),
          minQuantityTickSize: market.minQuantityTickSize.toString(),
          status: market.marketStatus,
        }
      })
      
      setSpotMarkets(marketsWithSymbols)
    } catch (error) {
      console.error('Error loading markets:', error)
    }
  }

  useEffect(() => {
    loadMarkets()
  }, [])

  const createSpotOrder = async (market: Market, price: string, quantity: string) => {
    try {
      const msg = makeMsgCreateSpotLimitOrder({
        price,
        quantity,
        orderType: 1, // 1 for buy, 2 for sell
        injectiveAddress: address,
        market,
      })

      const response = await msgBroadcaster.broadcast({
        msgs: [msg],
        injectiveAddress: address,
      })

      console.log('Order created:', response)
    } catch (error) {
      console.error('Error creating spot order:', error)
    }
  }

  const loadOrderBook = async (market: Market) => {
    try {
      const orderbook = await indexerSpotApi.fetchOrderbookV2(market.marketId)
      
      // 处理卖单（asks）
      const sells = orderbook.sells.map(sell => {
        const price = formatPrice(sell.price, market.baseDecimals, market.quoteDecimals)
        const size = formatQuantity(sell.quantity)
        return {
          price,
          size,
          total: (Number(price) * Number(size)).toFixed(3)
        }
      })

      // 处理买单（bids）
      const buys = orderbook.buys.map(buy => {
        const price = formatPrice(buy.price, market.baseDecimals, market.quoteDecimals)
        const size = formatQuantity(buy.quantity)
        return {
          price,
          size,
          total: (Number(price) * Number(size)).toFixed(3)
        }
      })

      // 更新当前市场价格
      const currentPrice = orderbook.buys.length > 0 
        ? formatPrice(orderbook.buys[0].price, market.baseDecimals, market.quoteDecimals)
        : orderbook.sells.length > 0 
          ? formatPrice(orderbook.sells[0].price, market.baseDecimals, market.quoteDecimals)
          : '0.000'

      setOrderBook({ buys, sells })
      setSelectedMarket({
        ...market,
        price: currentPrice
      })
    } catch (error) {
      console.error('Error loading orderbook:', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Injective DEX</h1>
      
      {!address ? (
        <button
          onClick={connectWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          连接钱包
        </button>
      ) : (
        <div>
          <p className="mb-2">钱包地址: {address}</p>
          
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">钱包余额</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {balances.map((balance) => (
                <div key={balance.denom} className="border p-4 rounded">
                  <p className="font-semibold">{balance.denom}</p>
                  <p className="text-sm text-gray-600">
                    余额: {balance.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">现货市场</h2>
            
            {/* 市场选择器 */}
            <div className="flex gap-2 mb-4">
              {spotMarkets.map((market) => (
                <button
                  key={market.marketId}
                  onClick={() => loadOrderBook(market)}
                  className={`px-3 py-1 rounded ${
                    selectedMarket?.marketId === market.marketId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  {market.ticker}
                </button>
              ))}
            </div>

            {/* 订单簿显示 */}
            {selectedMarket && (
              <div className="border rounded-lg p-6 bg-[#1A1A1A] text-white">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg">{selectedMarket.ticker} 订单簿</h3>
                  <div className="grid grid-cols-3 gap-8 text-sm w-2/3 text-right text-gray-400">
                    <span>Price ({selectedMarket.quoteSymbol})</span>
                    <span>Size ({selectedMarket.baseSymbol})</span>
                    <span>Total ({selectedMarket.quoteSymbol})</span>
                  </div>
                </div>

                {/* 卖单区域 */}
                <div className="mb-4 max-h-[400px] overflow-y-auto">
                  {orderBook.sells.slice().reverse().map((sell, index) => (
                    <div 
                      key={index} 
                      className="grid grid-cols-3 gap-8 text-[#FF3B3B] mb-1 hover:bg-[#2A2A2A] py-1 px-2 rounded"
                    >
                      <span className="text-right font-mono">{sell.price}</span>
                      <span className="text-right font-mono">{sell.size}</span>
                      <span className="text-right font-mono">{sell.total}</span>
                    </div>
                  ))}
                </div>

                {/* 当前价格 */}
                <div className="text-center py-3 border-y border-[#2A2A2A] my-3">
                  <div className="text-2xl font-mono font-bold">
                    {selectedMarket.price}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    ≈ {selectedMarket.quoteSymbol}
                  </div>
                </div>

                {/* 买单区域 */}
                <div className="max-h-[400px] overflow-y-auto">
                  {orderBook.buys.map((buy, index) => (
                    <div 
                      key={index} 
                      className="grid grid-cols-3 gap-8 text-[#00C076] mb-1 hover:bg-[#2A2A2A] py-1 px-2 rounded"
                    >
                      <span className="text-right font-mono">{buy.price}</span>
                      <span className="text-right font-mono">{buy.size}</span>
                      <span className="text-right font-mono">{buy.total}</span>
                    </div>
                  ))}
                </div>

                {/* 交易操作区 */}
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => createSpotOrder(selectedMarket, orderBook.sells[0]?.price || '0', '1')}
                    className="bg-[#FF3B3B] hover:bg-[#FF4B4B] text-white px-6 py-3 rounded-lg flex-1 font-semibold transition-colors"
                  >
                    卖出
                  </button>
                  <button
                    onClick={() => createSpotOrder(selectedMarket, orderBook.buys[0]?.price || '0', '1')}
                    className="bg-[#00C076] hover:bg-[#00D086] text-white px-6 py-3 rounded-lg flex-1 font-semibold transition-colors"
                  >
                    买入
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 