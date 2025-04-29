import React, { useEffect, useState } from 'react'
import { walletStrategy } from '../services/Wallet'
import { msgBroadcaster } from '../services/MsgBroadcaster'
import {
  fetchSpotMarkets,
  fetchDerivativeMarkets,
  fetchBankBalances,
} from '../services/Query'
import { makeMsgCreateSpotLimitOrder } from '../services/Transactions'

export const Dex: React.FC = () => {
  const [address, setAddress] = useState<string>('')
  const [spotMarkets, setSpotMarkets] = useState<any[]>([])
  const [derivativeMarkets, setDerivativeMarkets] = useState<any[]>([])

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

  const loadMarkets = async () => {
    try {
      const [spot, derivative] = await Promise.all([
        fetchSpotMarkets(),
        fetchDerivativeMarkets(),
      ])
      setSpotMarkets(spot)
      setDerivativeMarkets(derivative)
    } catch (error) {
      console.error('Error loading markets:', error)
    }
  }

  useEffect(() => {
    loadMarkets()
  }, [])

  const createSpotOrder = async (market: any, price: string, quantity: string) => {
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 