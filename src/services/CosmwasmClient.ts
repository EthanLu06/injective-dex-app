import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import { ChainGrpcWasmApi } from "@injectivelabs/sdk-ts";
import { walletStrategy, getActiveWalletType, WalletType } from "./Wallet";
import { MsgExecuteContractCompat } from "@injectivelabs/sdk-ts";
import { MsgBroadcaster } from "@injectivelabs/wallet-core";
import { toBase64, fromBase64 } from "@injectivelabs/sdk-ts";
import { Buffer } from "buffer";

// Injective Testnet
const NETWORK = Network.Testnet;
const ENDPOINTS = getNetworkEndpoints(NETWORK);

// Initialize the wasm API client
const chainWasmApi = new ChainGrpcWasmApi(ENDPOINTS.grpc);

// 创建MsgBroadcaster - 根据钱包类型使用不同配置
const createMsgBroadcaster = () => {
  const activeWallet = getActiveWalletType();

  if (activeWallet === WalletType.MetaMask) {
    // MetaMask使用EIP-712签名，需要特殊配置
    return new MsgBroadcaster({
      walletStrategy,
      network: NETWORK,
      endpoints: ENDPOINTS,
      simulateTx: true,
      gasBufferCoefficient: 1.1,
    });
  } else {
    // Keplr使用标准Cosmos签名
    return new MsgBroadcaster({
      walletStrategy,
      network: NETWORK,
      endpoints: ENDPOINTS,
      simulateTx: false, // Keplr不需要模拟交易
    });
  }
};

// Contract address - update this with your deployed contract address
const COUNTER_CONTRACT_ADDRESS = "inj133yj4674mf0mz4vnya76t0ckel23q62ygtgzyp"; // 已更新为您的合约地址

// Counter contract query functions - 参考官方模板
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

    // 使用官方模板的方式解析响应
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

// Counter contract execute functions - 参考官方模板
export const incrementCounter = async (
  injectiveAddress: string
): Promise<string> => {
  try {
    console.log("=== 开始增加计数器 ===");
    console.log("合约地址:", COUNTER_CONTRACT_ADDRESS);
    console.log("发送者地址:", injectiveAddress);
    console.log("网络:", NETWORK);
    console.log("端点:", ENDPOINTS);

    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: COUNTER_CONTRACT_ADDRESS,
      sender: injectiveAddress,
      msg: {
        increment: {},
      },
    });

    console.log("创建的消息:", msg);

    // 根据当前钱包类型创建MsgBroadcaster
    const msgBroadcastClient = createMsgBroadcaster();
    console.log(
      "使用的MsgBroadcaster配置:",
      getActiveWalletType() === WalletType.MetaMask
        ? "MetaMask (EIP-712)"
        : "Keplr (Cosmos)"
    );

    const response = await msgBroadcastClient.broadcast({
      msgs: msg,
      injectiveAddress: injectiveAddress,
    });

    console.log("交易广播结果:", response);
    console.log("=== 增加计数器完成 ===");
    return response.txHash;
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

    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: COUNTER_CONTRACT_ADDRESS,
      sender: injectiveAddress,
      msg: {
        reset: { count },
      },
    });

    // 根据当前钱包类型创建MsgBroadcaster
    const msgBroadcastClient = createMsgBroadcaster();

    const response = await msgBroadcastClient.broadcast({
      msgs: msg,
      injectiveAddress: injectiveAddress,
    });

    console.log("Reset transaction result:", response);
    return response.txHash;
  } catch (error) {
    console.error("Error resetting counter:", error);
    throw error;
  }
};
