// filename: Wallet.ts
import { WalletStrategy } from "@injectivelabs/wallet-strategy";
import { ChainId } from "@injectivelabs/ts-types";

const CHAIN_ID = ChainId.Testnet;

// 初始化钱包策略
export const walletStrategy = new WalletStrategy({
  chainId: CHAIN_ID,
  strategies: {},
});

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

// 连接特定类型的钱包
export const connectWallet = async (
  walletType: WalletType
): Promise<string | null> => {
  try {
    setActiveWalletType(walletType);

    // 1.15.3版本的API支持直接连接
    if (walletType === WalletType.Keplr) {
      // 尝试使用Keplr连接
      await walletStrategy.connectToKeplr?.();
    } else if (walletType === WalletType.MetaMask) {
      // 尝试使用MetaMask连接
      await walletStrategy.connectToMetamask?.();
    }

    const addresses = await walletStrategy.getAddresses();

    if (addresses.length > 0) {
      // 触发连接成功事件，让其他组件知道地址已更新
      window.dispatchEvent(
        new CustomEvent("walletConnected", { detail: addresses[0] })
      );
      return addresses[0];
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
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
  }
};
