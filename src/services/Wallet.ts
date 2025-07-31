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
    console.log(`正在切换到钱包类型: ${walletType}`);

    // 先断开当前连接
    try {
      await walletStrategy.disconnect();
      console.log("已断开之前的钱包连接");
    } catch (e) {
      console.log("断开连接时出错（可能是首次连接）:", e);
    }

    // 设置新的钱包类型
    setActiveWalletType(walletType);

    // 等待一下确保断开操作完成
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 尝试获取钱包地址
    try {
      const addresses = await walletStrategy.getAddresses();
      console.log("获取到的地址:", addresses);

      if (addresses.length > 0) {
        // 触发连接成功事件，让其他组件知道地址已更新
        window.dispatchEvent(
          new CustomEvent("walletConnected", { detail: addresses[0] })
        );
        console.log(`成功连接到 ${walletType} 钱包，地址: ${addresses[0]}`);
        return addresses[0];
      }
    } catch (error) {
      console.error(`获取 ${walletType} 钱包地址失败:`, error);
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
