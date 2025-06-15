"use client";

import { useMiniKit, useOpenUrl } from "@coinbase/onchainkit/minikit";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ZoraWalletInput } from "@/components/ui/ZoraWalletInput";

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
      <div className="w-full">
        <main className="w-full h-screen flex items-center justify-center">
          <ZoraWalletInput
            displayName={context?.user?.displayName || ""}
            onHandleChange={(handle) => setZoraHandle(handle)}
          />
        </main>

        {/* <footer className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ock-text-foreground-muted)] text-xs"
            onClick={() => openUrl("https://base.org/builders/minikit")}
          >
            Built on Base with MiniKit
          </Button>
        </footer> */}
      </div>
    </div>
  );
}
