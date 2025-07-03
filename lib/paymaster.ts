import { Address, Hex } from "viem";
import { PAYMASTER_URL, PAYMASTER_POLICY_ID } from "./spend-permission-constants";

export interface PaymasterRequest {
  method: string;
  params: any[];
}

export interface PaymasterResponse {
  paymasterAndData: Hex;
  preVerificationGas: Hex;
  verificationGasLimit: Hex;
  callGasLimit: Hex;
}

/**
 * Get paymaster data for sponsoring a transaction
 */
export async function getPaymasterData(
  userAddress: Address,
  callData: Hex,
  contractAddress: Address
): Promise<PaymasterResponse | null> {
  try {
    if (!PAYMASTER_POLICY_ID) {
      console.warn("Paymaster policy ID not configured");
      return null;
    }

    const response = await fetch(PAYMASTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "pm_getPaymasterData",
        params: [
          {
            sender: userAddress,
            nonce: "0x0", // Will be filled by the paymaster
            initCode: "0x",
            callData,
            callGasLimit: "0x0", // Will be estimated by the paymaster
            verificationGasLimit: "0x0", // Will be estimated by the paymaster
            preVerificationGas: "0x0", // Will be estimated by the paymaster
            maxFeePerGas: "0x0", // Will be filled by the paymaster
            maxPriorityFeePerGas: "0x0", // Will be filled by the paymaster
            paymasterAndData: "0x",
            signature: "0x",
          },
          contractAddress,
          PAYMASTER_POLICY_ID,
        ],
        id: 1,
        jsonrpc: "2.0",
      }),
    });

    if (!response.ok) {
      console.error("Paymaster request failed:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error("Paymaster error:", data.error);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error("Error getting paymaster data:", error);
    return null;
  }
}

/**
 * Check if paymaster is available
 */
export function isPaymasterAvailable(): boolean {
  return Boolean(PAYMASTER_POLICY_ID);
} 