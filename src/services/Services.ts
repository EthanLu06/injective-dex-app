import {
  ChainGrpcBankApi,
  IndexerGrpcSpotApi,
  IndexerGrpcDerivativesApi,
} from '@injectivelabs/sdk-ts'
import { getNetworkEndpoints, Network } from '@injectivelabs/networks'

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