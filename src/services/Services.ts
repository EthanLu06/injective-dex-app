import {
  ChainGrpcBankApi,
  IndexerGrpcSpotApi,
  IndexerGrpcDerivativesApi,
  SpotMarket,
  getSpotMarketTensMultiplier
} from '@injectivelabs/sdk-ts'
import { getNetworkEndpoints, Network } from '@injectivelabs/networks'
import { BigNumber } from '@injectivelabs/utils'

// 使用测试网
export const NETWORK = Network.Testnet
export const ENDPOINTS = getNetworkEndpoints(NETWORK)

// 初始化各种API客户端
export const chainBankApi = new ChainGrpcBankApi(ENDPOINTS.grpc)
export const indexerSpotApi = new IndexerGrpcSpotApi(ENDPOINTS.indexer)
export const indexerDerivativesApi = new IndexerGrpcDerivativesApi(ENDPOINTS.indexer)

// 获取钱包余额
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

// 市场详情接口定义
interface MarketDetails {
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
  priceTensMultiplier: string
  quantityTensMultiplier: string
}

// 获取市场列表并处理数据
export const fetchMarketsWithDetails = async (): Promise<MarketDetails[]> => {
  try {
    const spot = await indexerSpotApi.fetchMarkets()
    
    // 只获取前5个市场的基本信息
    const marketsWithSymbols = spot.slice(0, 5).map((market: SpotMarket) => {
      // 从ticker中分离出基础代币和报价代币的符号
      const [baseSymbol, quoteSymbol] = market.ticker.split('/')
      
      // 获取代币精度，如果未定义则使用默认值
      const baseDecimals = market.baseToken?.decimals || 18
      const quoteDecimals = market.quoteToken?.decimals || 6
      
      // 获取市场的tens multiplier，用于价格和数量的精度调整
      const { priceTensMultiplier, quantityTensMultiplier } = getSpotMarketTensMultiplier({
        minPriceTickSize: market.minPriceTickSize,
        minQuantityTickSize: market.minQuantityTickSize,
        baseDecimals,
        quoteDecimals,
      })

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
        priceTensMultiplier: priceTensMultiplier.toString(),
        quantityTensMultiplier: quantityTensMultiplier.toString(),
      }
    })
    
    return marketsWithSymbols
  } catch (error) {
    console.error('Error loading markets:', error)
    throw error
  }
}

// 订单簿市场接口定义
interface Market {
  marketId: string
  baseDecimals: number
  quoteDecimals: number
}

// 获取订单簿数据
export const fetchOrderBook = async (market: Market) => {
  try {
    const orderbook = await indexerSpotApi.fetchOrderbookV2(market.marketId)
    console.log('market', market) 
    console.log('orderbook', orderbook)

    // 格式化订单数据，包括价格和数量的转换
    const formatOrder = (order: { price: string; quantity: string }) => {
      // 将价格转换为人类可读格式，考虑代币精度差异
      const price = new BigNumber(order.price)
        .shiftedBy(market.baseDecimals - market.quoteDecimals)
        .toFixed(3)

      // 将数量转换为人类可读格式
      const size = new BigNumber(order.quantity)
        .shiftedBy(-market.baseDecimals)
        .toFixed(3)
      return {
        price,
        size,
        total: (Number(price) * Number(size)).toFixed(3)
      }
    }

    // 处理卖单（asks）
    const sells = orderbook.sells.map(formatOrder)

    // 处理买单（bids）
    const buys = orderbook.buys.map(formatOrder)

    // 计算当前市场价格
    // 优先使用最高买单价格，如果没有买单则使用最低卖单价格
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

