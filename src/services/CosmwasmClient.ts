import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import { ChainGrpcWasmApi } from "@injectivelabs/sdk-ts";
import {
  walletStrategy,
  getActiveWalletType,
  WalletType,
  connectWallet,
} from "./Wallet";
import { MsgExecuteContractCompat } from "@injectivelabs/sdk-ts";
import { msgBroadcaster } from "./MsgBroadcaster";

// 浏览器兼容的 base64 编码函数 - 编码查询消息
function toBase64(obj: any): string {
  return btoa(JSON.stringify(obj));
}

// Injective Testnet
const NETWORK = Network.Testnet;
const ENDPOINTS = getNetworkEndpoints(NETWORK);

// Initialize the wasm API client
const chainWasmApi = new ChainGrpcWasmApi(ENDPOINTS.grpc);

// Contract address - update this with your deployed contract address
const COUNTER_CONTRACT_ADDRESS = "inj133yj4674mf0mz4vnya76t0ckel23q62ygtgzyp"; // 已更新为您的合约地址

// Counter contract query functions - 根据错误信息修改为小写格式
export const getCount = async (): Promise<number> => {
  try {
    console.log(
      "Fetching counter value from contract:",
      COUNTER_CONTRACT_ADDRESS
    );

    // 使用小写格式的 get_count 而不是 GetCount
    const response = await chainWasmApi.fetchSmartContractState(
      COUNTER_CONTRACT_ADDRESS,
      toBase64({ get_count: {} })
    );

    console.log("Raw response:", response);

    // 处理响应数据
    let result;
    if (typeof response.data === "string") {
      try {
        result = JSON.parse(response.data);
      } catch (e) {
        console.log(
          "Failed to parse response as JSON, raw data:",
          response.data
        );
        throw new Error("Invalid response format");
      }
    } else if (response.data instanceof Uint8Array) {
      const textDecoder = new TextDecoder();
      const dataStr = textDecoder.decode(response.data);
      result = JSON.parse(dataStr);
    } else {
      result = response.data;
    }

    console.log("Parsed result:", result);
    return result.count;
  } catch (error) {
    console.error("Error querying counter:", error);
    throw error;
  }
};

// 确保在交易前根据用户选择设置正确的钱包策略
const ensureCorrectWallet = async () => {
  try {
    const activeWalletType = getActiveWalletType();
    console.log("当前活跃钱包:", activeWalletType);

    // 使用connectWallet函数重新连接当前选择的钱包
    // 将string类型转换为WalletType类型
    await connectWallet(activeWalletType as WalletType);
  } catch (e) {
    console.warn("重新连接钱包失败", e);
  }
};

// Counter contract execute functions - 根据错误信息修改为小写格式
export const incrementCounter = async (
  injectiveAddress: string
): Promise<string> => {
  try {
    // 确保使用正确的钱包
    await ensureCorrectWallet();

    // 使用小写格式的 increment 而不是 Increment
    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: COUNTER_CONTRACT_ADDRESS,
      sender: injectiveAddress,
      msg: {
        increment: {},
      },
    });

    const response = await msgBroadcaster.broadcast({
      msgs: [msg],
      injectiveAddress: injectiveAddress,
    });

    return response.txHash;
  } catch (error) {
    console.error("Error incrementing counter:", error);
    throw error;
  }
};

// 根据错误信息修改为小写格式
export const resetCounter = async (
  injectiveAddress: string,
  count: number
): Promise<string> => {
  try {
    // 确保使用正确的钱包
    await ensureCorrectWallet();

    // 使用小写格式的 reset 而不是 Reset
    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: COUNTER_CONTRACT_ADDRESS,
      sender: injectiveAddress,
      msg: {
        reset: { count },
      },
    });

    const response = await msgBroadcaster.broadcast({
      msgs: [msg],
      injectiveAddress: injectiveAddress,
    });

    return response.txHash;
  } catch (error) {
    console.error("Error resetting counter:", error);
    throw error;
  }
};
