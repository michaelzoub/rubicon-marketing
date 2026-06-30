"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { usePrivy } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ACTIVE_CHAIN } from "@/lib/chain";
import { RubiconError } from "@/lib/rubicon/client";

const PrivyConfiguredContext = createContext(false);

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => {
          if (error instanceof RubiconError && ["auth", "validation", "not_found"].includes(error.kind)) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function PrivyQueryProvider({ children }: { children: ReactNode }) {
  const { user } = usePrivy();
  return <QueryProvider key={user?.id ?? "anonymous"}>{children}</QueryProvider>;
}

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
      <PrivyQueryProvider>{children}</PrivyQueryProvider>
    </PrivyProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

  if (!appId) {
    return (
      <PrivyConfiguredContext.Provider value={false}>
        <QueryProvider>{children}</QueryProvider>
      </PrivyConfiguredContext.Provider>
    );
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
