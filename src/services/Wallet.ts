// filename: Wallet.ts
import { WalletStrategy } from "@injectivelabs/wallet-strategy";
import { ChainId, EthereumChainId } from "@injectivelabs/ts-types";
import { Web3Exception } from "@injectivelabs/exceptions";
import { getInjectiveAddress } from "@injectivelabs/sdk-ts";

// 定义Keplr Offline Signer接口
interface KeplrOfflineSigner {
  getAccounts(): Promise<Array<{ address: string; pubkey: Uint8Array }>>;
}

const CHAIN_ID = ChainId.Testnet;
const ETHEREUM_CHAIN_ID = EthereumChainId.Sepolia;

// 初始化钱包策略 - 明确指定策略
export const walletStrategy = new WalletStrategy({
  chainId: CHAIN_ID,
  ethereumOptions: {
    ethereumChainId: ETHEREUM_CHAIN_ID,
    rpcUrl: "https://eth-sepolia.alchemyapi.io/v2/demo",
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

// 连接特定类型的钱包 - 强制使用选定钱包
export const connectWallet = async (
  walletType: WalletType
): Promise<string | null> => {
  try {
    console.log(`正在连接到钱包类型: ${walletType}`);

    // 设置钱包类型
    setActiveWalletType(walletType);

    // 先断开之前的连接
    await walletStrategy.disconnect();
    console.log("已断开之前的钱包连接");

    // 检查钱包是否可用
    if (walletType === WalletType.Keplr) {
      if (!window.keplr) {
        throw new Error("Keplr钱包未安装，请先安装Keplr扩展");
      }
      console.log("检测到Keplr钱包，正在连接...");

      // 强制连接Keplr
      await window.keplr.enable(CHAIN_ID);
      const keplrOfflineSigner = window.keplr.getOfflineSigner(
        CHAIN_ID
      ) as KeplrOfflineSigner;
      const keplrAccounts = await keplrOfflineSigner.getAccounts();

      if (keplrAccounts.length > 0) {
        const address = keplrAccounts[0].address;
        console.log(`成功连接到Keplr钱包，地址: ${address}`);

        // 触发连接成功事件
        window.dispatchEvent(
          new CustomEvent("walletConnected", { detail: address })
        );
        return address;
      }
    } else if (walletType === WalletType.MetaMask) {
      if (!window.ethereum) {
        throw new Error("MetaMask钱包未安装，请先安装MetaMask扩展");
      }
      console.log("检测到MetaMask钱包，正在连接...");

      // 强制连接MetaMask
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        const ethereumAddress = accounts[0];
        const injectiveAddress = getInjectiveAddress(ethereumAddress);
        console.log("转换后的Injective地址:", injectiveAddress);

        // 触发连接成功事件
        window.dispatchEvent(
          new CustomEvent("walletConnected", { detail: injectiveAddress })
        );
        return injectiveAddress;
      }
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
