// filename: Wallet.ts
import { WalletStrategy } from '@injectivelabs/wallet-strategy'
import { ChainId, EthereumChainId } from '@injectivelabs/ts-types'

const CHAIN_ID = ChainId.Mainnet // The Injective Chain chainId
// const ETHEREUM_CHAIN_ID = EthereumChainId.Sepolia // The Ethereum Chain ID

export const alchemyRpcEndpoint = `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_GOERLI_KEY}`

export const walletStrategy = new WalletStrategy({
  chainId: CHAIN_ID,
  // ethereumOptions: {
  //   rpcUrl: alchemyRpcEndpoint,
  //   ethereumChainId: ETHEREUM_CHAIN_ID,
  // },
  strategies: {},
})