/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useZoraProfile.ts
"use client";

import { useEffect, useState } from "react";
import { getProfile } from "@zoralabs/coins-sdk";

export function useUserProfile(address?: string) {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getProfile({ identifier: address });
        setProfile(data?.data?.profile);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [address]);

  return { profile, loading, error };
}
