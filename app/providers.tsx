"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ACTIVE_CHAIN } from "@/lib/chain";

const PrivyConfiguredContext = createContext(false);

function useSystemTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => setTheme(media.matches ? "dark" : "light");
    syncTheme();
    media.addEventListener("change", syncTheme);
    return () => media.removeEventListener("change", syncTheme);
  }, []);

  return theme;
}

function PrivyWithSystemTheme({
  appId,
  clientId,
  children,
}: {
  appId: string;
  clientId?: string;
  children: ReactNode;
}) {
  const theme = useSystemTheme();

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        loginMethods: ["twitter", "email", "wallet"],
        appearance: {
          theme,
          accentColor: "#2d91ed",
        },
        defaultChain: ACTIVE_CHAIN,
        supportedChains: [ACTIVE_CHAIN],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

  if (!appId) {
    return <PrivyConfiguredContext.Provider value={false}>{children}</PrivyConfiguredContext.Provider>;
  }

  return (
    <PrivyConfiguredContext.Provider value>
      <PrivyWithSystemTheme appId={appId} clientId={clientId}>
        {children}
      </PrivyWithSystemTheme>
    </PrivyConfiguredContext.Provider>
  );
}

export function usePrivyConfigured() {
  return useContext(PrivyConfiguredContext);
}
