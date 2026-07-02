"use client";

import { ArrowUpRight, Droplets } from "lucide-react";
import Image from "next/image";
import { trackClick } from "../analytics-links";

const faucetUrl = "https://faucet.circle.com/";

export function DevelopersTestnetFaucet() {
  return (
    <aside className="developers-testnet-faucet developers-agents-onboarding-card" aria-labelledby="developers-testnet-faucet-heading">
      <div className="developers-testnet-faucet-header">
        <h2 id="developers-testnet-faucet-heading" className="developers-skill-panel-title">
          <Droplets size={17} className="text-[var(--river)]" aria-hidden="true" />
          Get testnet USDC
        </h2>
        <p className="developers-testnet-faucet-copy">
          Rubicon testnet reads settle on Arc Testnet. Fund your buyer wallet with free testnet USDC from Circle&apos;s
          faucet before your first capped read.
        </p>
      </div>

      <div className="developers-testnet-faucet-logos" aria-hidden="true">
        <Image
          src="/Circle_logo.webp"
          alt=""
          width={132}
          height={36}
          className="developers-testnet-faucet-logo developers-testnet-faucet-logo--circle"
        />
        <Image
          src="/arc-logo.webp"
          alt=""
          width={88}
          height={36}
          className="developers-testnet-faucet-logo developers-testnet-faucet-logo--arc"
        />
      </div>

      <div className="developers-testnet-faucet-actions">
        <a
          href={faucetUrl}
          className="button button-secondary min-h-10 text-sm"
          target="_blank"
          rel="noreferrer"
          onClick={() => trackClick("external_link_clicked", { label: "Circle Faucet", location: "developers_testnet" })}
        >
          Open Circle Faucet
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
        <p className="developers-testnet-faucet-note mono">
          Select Arc Testnet, paste your wallet address — up to 20 USDC every 2 hours.
        </p>
      </div>
    </aside>
  );
}
