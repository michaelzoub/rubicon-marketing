"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { createContext, useContext, type ReactNode } from "react";

const PrivyConfiguredContext = createContext(false);

export function AppProviders({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

  if (!appId) {
    return <PrivyConfiguredContext.Provider value={false}>{children}</PrivyConfiguredContext.Provider>;
  }

  return (
    <PrivyConfiguredContext.Provider value>
      <PrivyProvider
        appId={appId}
        clientId={clientId}
        config={{
          loginMethods: ["twitter", "email", "wallet"],
          appearance: {
            theme: "light",
            accentColor: "#2f6df0",
          },
        }}
      >
        {children}
      </PrivyProvider>
    </PrivyConfiguredContext.Provider>
  );
}

export function usePrivyConfigured() {
  return useContext(PrivyConfiguredContext);
}
