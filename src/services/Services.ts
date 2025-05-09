import {
  ChainGrpcBankApi,
  IndexerGrpcSpotApi,
  IndexerGrpcDerivativesApi,
} from '@injectivelabs/sdk-ts'
import { getNetworkEndpoints, Network } from '@injectivelabs/networks'
import { BigNumber } from '@injectivelabs/utils'

// 使用测试网
export const NETWORK = Network.Testnet
export const ENDPOINTS = getNetworkEndpoints(NETWORK)

export const chainBankApi = new ChainGrpcBankApi(ENDPOINTS.grpc)
export const indexerSpotApi = new IndexerGrpcSpotApi(ENDPOINTS.indexer)
export const indexerDerivativesApi = new IndexerGrpcDerivativesApi(ENDPOINTS.indexer)

export const fetchBalances = async (injectiveAddress: string) => {
  try {
    console.log('Fetching balances for address:', injectiveAddress)
    console.log('Using endpoints:', ENDPOINTS)
    const result = await chainBankApi.fetchBalances(injectiveAddress)
    console.log('Balance result:', result)
    return result
  } catch (error) {
    console.error('Error fetching balances:', error)
    throw error
  }
}

export const fetchSpotMarkets = async () => {
  try {
    console.log('Fetching spot markets')
    const result = await indexerSpotApi.fetchMarkets()
    console.log('Spot markets result:', result)
    return result
  } catch (error) {
    console.error('Error fetching spot markets:', error)
    throw error
  }
}

interface Market {
  marketId: string
  baseDecimals: number
  quoteDecimals: number
}

export const fetchOrderBook = async (market: Market) => {
  try {
    const orderbook = await indexerSpotApi.fetchOrderbookV2(market.marketId)
    console.log('market', market) 
    console.log('orderbook', orderbook)

    const formatOrder = (order: { price: string; quantity: string }) => {
      const price = new BigNumber(order.price)
        .shiftedBy(market.baseDecimals - market.quoteDecimals)
        .toFixed(3)

      const size = new BigNumber(order.quantity)
        .shiftedBy(-market.baseDecimals)
        .toFixed(3)
      return {
        price,
        size,
        total: (Number(price) * Number(size)).toFixed(3)
      }
    }

    // Process sell orders (asks)
    const sells = orderbook.sells.map(formatOrder)

    // Process buy orders (bids)
    const buys = orderbook.buys.map(formatOrder)

    // Update current market price
    const currentPrice = orderbook.buys.length > 0 
      ? new BigNumber(orderbook.buys[0].price)
        .shiftedBy(market.baseDecimals - market.quoteDecimals)
        .toFixed(3)
      : orderbook.sells.length > 0 
        ? new BigNumber(orderbook.sells[0].price)
          .shiftedBy(market.baseDecimals - market.quoteDecimals)
          .toFixed(3)
        : '0.000'

    return {
      buys,
      sells,
      currentPrice
    }
  } catch (error) {
    console.error('Error loading orderbook:', error)
    throw error
  }
} 