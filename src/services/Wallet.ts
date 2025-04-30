// filename: Wallet.ts
import { WalletStrategy } from '@injectivelabs/wallet-strategy'
import { ChainId } from '@injectivelabs/ts-types'

const CHAIN_ID = ChainId.Testnet // 修改为测试网

export const alchemyRpcEndpoint = `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_GOERLI_KEY}`

export const walletStrategy = new WalletStrategy({
  chainId: CHAIN_ID,
  // ethereumOptions: {
  //   rpcUrl: alchemyRpcEndpoint,
  //   ethereumChainId: ETHEREUM_CHAIN_ID,
  // },
  strategies: {},
})