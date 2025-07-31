import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import { ChainGrpcWasmApi } from "@injectivelabs/sdk-ts";
import { walletStrategy } from "./Wallet";
import { MsgExecuteContractCompat } from "@injectivelabs/sdk-ts";
import { MsgBroadcaster } from "@injectivelabs/wallet-core";
import { toBase64, fromBase64 } from "@injectivelabs/sdk-ts";
import { Buffer } from "buffer";

// Injective Testnet
const NETWORK = Network.Testnet;
const ENDPOINTS = getNetworkEndpoints(NETWORK);

// Initialize the wasm API client
const chainWasmApi = new ChainGrpcWasmApi(ENDPOINTS.grpc);

// 创建MsgBroadcaster - 参考官方模板
export const msgBroadcastClient = new MsgBroadcaster({
  walletStrategy,
  network: NETWORK,
});

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
    console.log("Incrementing counter with address:", injectiveAddress);

    const msg = MsgExecuteContractCompat.fromJSON({
      contractAddress: COUNTER_CONTRACT_ADDRESS,
      sender: injectiveAddress,
      msg: {
        increment: {},
      },
    });

    const response = await msgBroadcastClient.broadcast({
      msgs: msg,
      injectiveAddress: injectiveAddress,
    });

    console.log("Increment transaction result:", response);
    return response.txHash;
  } catch (error) {
    console.error("Error incrementing counter:", error);
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
