"use client";

import {
  useMiniKit,
  useAddFrame,
  useOpenUrl,
} from "@coinbase/onchainkit/minikit";
// import {
//   Name,
//   Identity,
//   Address,
//   Avatar,
//   EthBalance,
// } from "@coinbase/onchainkit/identity";
// import {
//   ConnectWallet,
//   Wallet,
//   WalletDropdown,
//   WalletDropdownDisconnect,
// } from "@coinbase/onchainkit/wallet";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ZoraWalletInput } from "@/components/ui/ZoraWalletInput";
import { Icon } from "@/components/ui/Icon";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function App() {
  const { setFrameReady, isFrameReady, context } = useMiniKit();
  const [zoraHandle, setZoraHandle] = useState<string>("");

  const openUrl = useOpenUrl();

  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
      <div className="w-full max-w-4xl mx-auto px-4 py-3">
        <main className="flex-1">
          <ZoraWalletInput
            displayName={context?.user?.displayName || ""}
            onHandleChange={(handle) => setZoraHandle(handle)}
          />
        </main>

        <footer className="mt-2 pt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer>
      </div>
    </div>
  );
}
