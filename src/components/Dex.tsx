import React, { useEffect, useState } from 'react'
import { walletStrategy } from '../services/Wallet'
import { msgBroadcaster } from '../services/MsgBroadcaster'
import {
  fetchSpotMarkets,
  fetchDerivativeMarkets,
  indexerSpotApi,
} from '../services/Query'
import { makeMsgCreateSpotLimitOrder } from '../services/Transactions'
import { SpotMarket, PerpetualMarket, BinaryOptionsMarket } from '@injectivelabs/sdk-ts'

interface Market {
  marketId: string
  ticker: string
  baseDenom: string
  quoteDenom: string
  baseSymbol: string
  quoteSymbol: string
  minPriceTickSize: string
  minQuantityTickSize: string
  status: string
  price?: string
}

interface DerivativeMarket {
  marketId: string
  ticker: string
  baseToken: string
  quoteToken: string
  minPriceTickSize: string
  minQuantityTickSize: string
  status: string
}

export const Dex: React.FC = () => {
  const [address, setAddress] = useState<string>('')
  const [spotMarkets, setSpotMarkets] = useState<Market[]>([])
  const [derivativeMarkets, setDerivativeMarkets] = useState<DerivativeMarket[]>([])

  const connectWallet = async () => {
    try {
      const addresses = await walletStrategy.getAddresses()
      if (addresses.length > 0) {
        setAddress(addresses[0])
      }
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const formatPrice = (price: string, baseDecimals: number, quoteDecimals: number) => {
    const priceNum = Number(price)
    if (isNaN(priceNum)) return '0'
    // 根据代币精度计算实际价格
    const priceFactor = Math.pow(10, baseDecimals - quoteDecimals)
    return (priceNum * priceFactor).toFixed(4)
  }

  const loadMarkets = async () => {
    try {
      const [spot, derivative] = await Promise.all([
        fetchSpotMarkets(),
        fetchDerivativeMarkets(),
      ])
      
      // 获取每个市场的价格，并限制为前10个
      const marketsWithPrice = await Promise.all(
        spot.slice(0, 10).map(async (market: SpotMarket) => {
          const orderbook = await indexerSpotApi.fetchOrderbookV2(market.marketId)
          console.log('orderbook', market.marketId, orderbook) 
          const price = orderbook.buys.length > 0 
            ? orderbook.buys[0].price 
            : orderbook.sells.length > 0 
              ? orderbook.sells[0].price 
              : '0'
            
          // 从 ticker 中提取代币符号
          const [baseSymbol, quoteSymbol] = market.ticker.split('/')
            
          return {
            marketId: market.marketId,
            ticker: market.ticker,
            baseDenom: market.baseDenom,
            quoteDenom: market.quoteDenom,
            baseSymbol,
            quoteSymbol,
            minPriceTickSize: market.minPriceTickSize.toString(),
            minQuantityTickSize: market.minQuantityTickSize.toString(),
            status: market.marketStatus,
            price: formatPrice(price, 18, 6), // INJ 18位小数，USDT 6位小数
          }
        })
      )
      
      setSpotMarkets(marketsWithPrice)
      
      // 转换衍生品市场数据
      const formattedDerivativeMarkets = derivative.map((market: PerpetualMarket | BinaryOptionsMarket) => {
        const [baseSymbol, quoteSymbol] = market.ticker.split('/')
        
        return {
          marketId: market.marketId,
          ticker: market.ticker,
          baseToken: baseSymbol,
          quoteToken: quoteSymbol,
          minPriceTickSize: market.minPriceTickSize.toString(),
          minQuantityTickSize: market.minQuantityTickSize.toString(),
          status: market.marketStatus,
        }
      })
      
      setDerivativeMarkets(formattedDerivativeMarkets)
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
            <h2 className="text-xl font-semibold mb-2">现货市场</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spotMarkets.map((market) => (
                <div key={market.marketId} className="border p-4 rounded">
                  <h3 className="font-semibold">{market.ticker}</h3>
                  <div className="text-sm text-gray-600">
                    <p>当前价格: {market.price} {market.quoteSymbol}</p>
                    <p>市场ID: {market.marketId}</p>
                    <p>基础代币: {market.baseSymbol}</p>
                    <p>报价代币: {market.quoteSymbol}</p>
                    <p>最小价格变动: {market.minPriceTickSize}</p>
                    <p>最小数量变动: {market.minQuantityTickSize}</p>
                    <p>状态: {market.status}</p>
                  </div>
                  <button
                    onClick={() => createSpotOrder(market, '100', '1')}
                    className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
                  >
                    买入
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">衍生品市场</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {derivativeMarkets.map((market) => (
                <div key={market.marketId} className="border p-4 rounded">
                  <h3 className="font-semibold">{market.ticker}</h3>
                  <div className="text-sm text-gray-600">
                    <p>市场ID: {market.marketId}</p>
                    <p>基础代币: {market.baseToken}</p>
                    <p>报价代币: {market.quoteToken}</p>
                    <p>最小价格变动: {market.minPriceTickSize}</p>
                    <p>最小数量变动: {market.minQuantityTickSize}</p>
                    <p>状态: {market.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 