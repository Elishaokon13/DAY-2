/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useZoraBalances.ts
"use client";

import { useEffect, useState } from "react";
import { getProfileBalances } from "@zoralabs/coins-sdk";

export function useUserBalances(address?: string) {
  const [balances, setBalances] = useState<any>(null); // use any here
  // const [coinBalances, setCoinBalances] = useState<any>(null); // use any here
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchBalances = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getProfileBalances({
          identifier: address,
          count: 10,
        });
        console.log("Fetched Zora balances:", result?.data?.profile?.coinBalances?.edges)

        setBalances(result?.data?.profile);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [address]);

  return { balances, isLoadingBalance: loading, isBalanceError: error };
}
