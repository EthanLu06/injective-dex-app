// filename: Wallet.ts
import { WalletStrategy } from "@injectivelabs/wallet-strategy";
import { ChainId, EthereumChainId } from "@injectivelabs/ts-types";
import { Web3Exception } from "@injectivelabs/exceptions";

const CHAIN_ID = ChainId.Testnet;
const ETHEREUM_CHAIN_ID = EthereumChainId.Sepolia;

// 初始化钱包策略 - 参考官方模板
export const walletStrategy = new WalletStrategy({
  chainId: CHAIN_ID,
  ethereumOptions: {
    ethereumChainId: ETHEREUM_CHAIN_ID,
    rpcUrl: "https://eth-sepolia.alchemyapi.io/v2/demo", // 使用demo key
  },
  strategies: {},
});

// 获取钱包地址 - 参考官方模板
export const getAddresses = async (): Promise<string[]> => {
  const addresses = await walletStrategy.getAddresses();

  if (addresses.length === 0) {
    throw new Web3Exception(
      new Error("There are no addresses linked in this wallet.")
    );
  }

  return addresses;
};

// 支持的钱包类型
export enum WalletType {
  Keplr = "keplr",
  MetaMask = "metamask",
}

// 设置默认钱包类型
let activeWalletType = WalletType.Keplr;

// 获取当前活动钱包类型
export const getActiveWalletType = (): string => {
  return activeWalletType;
};

// 设置当前活动钱包类型
export const setActiveWalletType = (walletType: WalletType): void => {
  activeWalletType = walletType;
};

// 连接特定类型的钱包 - 简化版本
export const connectWallet = async (
  walletType: WalletType
): Promise<string | null> => {
  try {
    console.log(`正在连接到钱包类型: ${walletType}`);

    // 设置钱包类型
    setActiveWalletType(walletType);

    // 直接获取地址，让walletStrategy自动处理连接
    const addresses = await getAddresses();

    if (addresses.length > 0) {
      const address = addresses[0];
      console.log(`成功连接到 ${walletType} 钱包，地址: ${address}`);

      // 触发连接成功事件
      window.dispatchEvent(
        new CustomEvent("walletConnected", { detail: address })
      );
      return address;
    }

    return null;
  } catch (error) {
    console.error(`Error connecting ${walletType} wallet:`, error);
    return null;
  }
};

// 断开钱包连接
export const disconnectWallet = async (): Promise<void> => {
  try {
    await walletStrategy.disconnect();
    window.dispatchEvent(new CustomEvent("walletDisconnected"));
    console.log("钱包已断开连接");
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
  }
};
