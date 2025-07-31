import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import { ChainGrpcWasmApi } from "@injectivelabs/sdk-ts";
import { getActiveWalletType, WalletType } from "./Wallet";
import { MsgExecuteContractCompat } from "@injectivelabs/sdk-ts";
import { toBase64, fromBase64 } from "@injectivelabs/sdk-ts";
import { Buffer } from "buffer";
import { ChainId } from "@injectivelabs/ts-types";
import { SigningStargateClient } from "@cosmjs/stargate";

// 扩展Window接口以包含钱包
declare global {
  interface Window {
    keplr?: {
      enable: (chainId: string) => Promise<void>;
      getOfflineSigner: (chainId: string) => any;
    };
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
    };
  }
}

// Injective Testnet
const NETWORK = Network.Testnet;
const ENDPOINTS = getNetworkEndpoints(NETWORK);

// Initialize the wasm API client
const chainWasmApi = new ChainGrpcWasmApi(ENDPOINTS.grpc);

// Contract address - update this with your deployed contract address
const COUNTER_CONTRACT_ADDRESS = "inj133yj4674mf0mz4vnya76t0ckel23q62ygtgzyp";

// Counter contract query functions
export const getCount = async (): Promise<number> => {
  try {
    console.log(
      "Fetching counter value from contract:",
      COUNTER_CONTRACT_ADDRESS
    );

    const response = await chainWasmApi.fetchSmartContractState(
      COUNTER_CONTRACT_ADDRESS,
      toBase64({ get_count: {} })
    );

    console.log("Raw response:", response);

    const { count } = fromBase64(
      Buffer.from(response.data).toString("base64")
    ) as { count: number };

    console.log("Parsed result:", { count });
    return count;
  } catch (error) {
    console.error("Error querying counter:", error);
    throw error;
  }
};

// 直接使用钱包原生API进行交易
export const incrementCounter = async (
  injectiveAddress: string
): Promise<string> => {
  try {
    console.log("=== 开始增加计数器 ===");
    console.log("合约地址:", COUNTER_CONTRACT_ADDRESS);
    console.log("发送者地址:", injectiveAddress);
    console.log("当前活动钱包类型:", getActiveWalletType());

    const activeWallet = getActiveWalletType();

    if (activeWallet === WalletType.Keplr) {
      // 使用Keplr原生API
      return await executeWithKeplr(injectiveAddress);
    } else if (activeWallet === WalletType.MetaMask) {
      // 使用MetaMask原生API
      return await executeWithMetaMask(injectiveAddress);
    } else {
      throw new Error("不支持的钱包类型");
    }
  } catch (error) {
    console.error("=== 增加计数器失败 ===");
    console.error("错误详情:", error);
    if (error instanceof Error) {
      console.error("错误类型:", error.constructor.name);
      console.error("错误消息:", error.message);
      if (error.stack) {
        console.error("错误堆栈:", error.stack);
      }
    }
    throw error;
  }
};

// 使用Keplr原生API执行交易
async function executeWithKeplr(injectiveAddress: string): Promise<string> {
  console.log("使用Keplr原生API执行交易");

  if (!window.keplr) {
    throw new Error("Keplr钱包未安装");
  }

  // 启用Keplr
  await window.keplr.enable(ChainId.Testnet);

  // 获取签名者
  const offlineSigner = window.keplr.getOfflineSigner(ChainId.Testnet);

  // 创建Stargate客户端
  const client = await SigningStargateClient.connectWithSigner(
    ENDPOINTS.rpc,
    offlineSigner
  );

  // 创建消息
  const msg = MsgExecuteContractCompat.fromJSON({
    contractAddress: COUNTER_CONTRACT_ADDRESS,
    sender: injectiveAddress,
    msg: {
      increment: {},
    },
  });

  // 执行交易
  const result = await client.signAndBroadcast(injectiveAddress, [msg], "auto");

  console.log("Keplr交易结果:", result);
  return result.transactionHash;
}

// 使用MetaMask原生API执行交易
async function executeWithMetaMask(injectiveAddress: string): Promise<string> {
  console.log("使用MetaMask原生API执行交易");

  if (!window.ethereum) {
    throw new Error("MetaMask钱包未安装");
  }

  // 获取以太坊地址
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (accounts.length === 0) {
    throw new Error("未获取到MetaMask账户");
  }

  const ethereumAddress = accounts[0];
  console.log("MetaMask地址:", ethereumAddress);

  // 创建消息
  const msg = MsgExecuteContractCompat.fromJSON({
    contractAddress: COUNTER_CONTRACT_ADDRESS,
    sender: injectiveAddress,
    msg: {
      increment: {},
    },
  });

  // 使用Injective的EIP-712签名
  // 这里需要实现EIP-712签名逻辑
  // 由于比较复杂，我们先抛出错误
  throw new Error("MetaMask EIP-712签名暂未实现，请使用Keplr钱包");
}

export const resetCounter = async (
  injectiveAddress: string,
  count: number
): Promise<string> => {
  try {
    console.log(
      "Resetting counter to:",
      count,
      "with address:",
      injectiveAddress
    );

    const activeWallet = getActiveWalletType();

    if (activeWallet === WalletType.Keplr) {
      return await executeResetWithKeplr(injectiveAddress, count);
    } else if (activeWallet === WalletType.MetaMask) {
      throw new Error("MetaMask暂不支持reset操作，请使用Keplr钱包");
    } else {
      throw new Error("不支持的钱包类型");
    }
  } catch (error) {
    console.error("Error resetting counter:", error);
    throw error;
  }
};

// 使用Keplr原生API执行reset
async function executeResetWithKeplr(
  injectiveAddress: string,
  count: number
): Promise<string> {
  console.log("使用Keplr原生API执行reset");

  if (!window.keplr) {
    throw new Error("Keplr钱包未安装");
  }

  await window.keplr.enable(ChainId.Testnet);
  const offlineSigner = window.keplr.getOfflineSigner(ChainId.Testnet);
  const client = await SigningStargateClient.connectWithSigner(
    ENDPOINTS.rpc,
    offlineSigner
  );

  const msg = MsgExecuteContractCompat.fromJSON({
    contractAddress: COUNTER_CONTRACT_ADDRESS,
    sender: injectiveAddress,
    msg: {
      reset: { count },
    },
  });

  const result = await client.signAndBroadcast(injectiveAddress, [msg], "auto");

  console.log("Keplr reset结果:", result);
  return result.transactionHash;
}
