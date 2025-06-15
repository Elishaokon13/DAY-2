/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useZoraBalances.ts
"use client";

import { useEffect, useState } from "react";
import { getProfileBalances } from "@zoralabs/coins-sdk";

export function useUserBalances(address?: string) {
  const [balances, setBalances] = useState<any>(null); // use any here
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sorted, setSorted] = useState<any[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalHolders, setTotalHolders] = useState(0);

  useEffect(() => {
    if (!address) return;

    const fetchBalances = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getProfileBalances({
          identifier: address,
          count: 150,
        });

        setBalances(result?.data?.profile);
        const mappedCoins = result?.data?.profile?.coinBalances?.edges;

        const filtered =
          mappedCoins?.filter(
            (item) =>
              item?.node?.coin?.creatorProfile?.handle?.toLowerCase() ===
              address.toLowerCase(),
          ) || [];

        const sorted = filtered.sort((a, b) => {
          const volumeA = parseFloat(a?.node?.coin?.totalVolume ?? "0");
          const volumeB = parseFloat(b?.node?.coin?.totalVolume ?? "0");
          return volumeB - volumeA; // Descending
        });

        const totalVolume = sorted.reduce((acc, item) => {
          return acc + parseFloat(item?.node?.coin?.totalVolume ?? "0");
        }, 0);

        const totalEarnings = sorted.reduce((acc, item) => {
          const earning = item?.node?.coin?.creatorEarnings?.[0]?.amountUsd;
          return acc + parseFloat(earning || "0");
        }, 0);
        const uniqueHolders = sorted.reduce((acc, item) => {
          const earning = item?.node?.coin?.uniqueHolders || "0";
          return acc + parseFloat(String(earning) || "0");
        }, 0);

        setSorted(sorted);
        setTotalVolume(totalVolume);
        setTotalEarnings(totalEarnings);
        setTotalPosts(sorted?.length);
        setTotalHolders(uniqueHolders);
        // console.log("Sorted by volume:", sorted?.length);
        // console.log("Total Trading Volume:", totalVolume);
        // console.log("Total Creator Earnings (USD):", totalEarnings);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [address]);

  return {
    balances,
    isLoadingBalance: loading,
    isBalanceError: error,
    sorted,
    totalVolume,
    totalEarnings,
    totalPosts,
    totalHolders,
  };
}
