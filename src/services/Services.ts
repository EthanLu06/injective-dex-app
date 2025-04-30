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
    return await chainBankApi.fetchBalances(injectiveAddress)
  } catch (error) {
    console.error('Error fetching balances:', error)
    throw error
  }
} 