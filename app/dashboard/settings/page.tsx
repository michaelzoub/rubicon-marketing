"use client";

import { getEmbeddedConnectedWallet, useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, LogOut, ShieldCheck, Wallet } from "lucide-react";
import { useRubiconMutation, useRubiconQuery } from "@/lib/rubicon/hooks";
import { SUPABASE_URL } from "@/lib/rubicon/auth";
import {
  Card,
  CardHeader,
  ErrorState,
  LoadingState,
  PageHeader,
  WalletStatePill,
} from "../_components/ui";

export default function SettingsPage() {
  const { user, logout } = usePrivy();
  const creator = useRubiconQuery((c) => c.getCreator(), []);
  const wallet = useRubiconQuery((c) => c.getWallet(), []);
  const updateCreator = useRubiconMutation((c, ...a: Parameters<typeof c.updateCreator>) => c.updateCreator(...a));
  const updateWallet = useRubiconMutation((c, walletInput: { address: string; network: string }) => c.updateWallet(walletInput));

  return (
    <div className="grid gap-6">
      <PageHeader title="Settings" description="Manage your creator profile, receiving wallet, and developer access." />

      {creator.status === "loading" && <LoadingState />}
      {creator.status === "error" && creator.error && <ErrorState error={creator.error} onRetry={creator.refetch} />}

      {creator.status === "success" && (
        <>
          {/* Account */}
          <Card>
            <CardHeader title="Account" />
            <div className="grid gap-4 p-5">
              <AccountName
                initial={creator.data?.displayName ?? ""}
                username={creator.data?.username ?? ""}
                connectedIdentity={user?.email?.address ?? user?.twitter?.username ?? null}
                pending={updateCreator.pending}
                onSave={async (name) => {
                  await updateCreator.run({ displayName: name });
                  creator.refetch();
                }}
              />
              <div className="flex items-center justify-between border-t border-[var(--faint)] pt-4">
                <span className="text-sm text-[var(--muted)]">Sign out of this device.</span>
                <button type="button" onClick={() => logout()} className="button button-secondary text-sm">
                  <LogOut size={15} aria-hidden="true" /> Sign out
                </button>
              </div>
            </div>
          </Card>

          {/* Creator identity */}
          <Card>
            <CardHeader title="Creator identity" />
            <div className="divide-y divide-[var(--faint)]">
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-medium">Username</div>
                  <div className="mt-0.5 text-sm text-[var(--muted)]">@{creator.data?.username}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#69b88c] bg-[#e8f6ef] px-2.5 py-0.5 text-xs font-medium text-[#165c3e]">
                  <ShieldCheck size={13} aria-hidden="true" /> Active
                </span>
              </div>
            </div>
          </Card>

          {/* Receiving wallet */}
          <Card>
            <CardHeader title="Receiving wallet" />
            <div className="p-5">
              {wallet.status === "loading" && <LoadingState />}
              {wallet.status === "error" && wallet.error && <ErrorState error={wallet.error} onRetry={wallet.refetch} />}
              {wallet.status === "success" && (
                <WalletEditor
                  address={wallet.data?.address ?? ""}
                  network={wallet.data?.network ?? "base"}
                  verified={wallet.data?.verified ?? false}
                  pending={updateWallet.pending}
                  error={updateWallet.error?.message ?? null}
                  onSave={async (addr, network) => {
                    await updateWallet.run({ address: addr, network });
                    wallet.refetch();
                  }}
                />
              )}
            </div>
          </Card>

          {/* Developer information */}
          <DeveloperInfo creatorId={creator.data?.id ?? ""} />
        </>
      )}
    </div>
  );
}

const inputClass = "h-11 rounded-lg border border-[var(--line)] px-3 outline-none focus:border-[var(--river)]";

function AccountName({
  initial,
  username,
  connectedIdentity,
  pending,
  onSave,
}: {
  initial: string;
  username: string;
  connectedIdentity: string | null;
  pending: boolean;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  useEffect(() => setName(initial), [initial]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2">
        <span className="text-sm font-medium">Display name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Username</span>
        <input value={username ? `@${username}` : "—"} readOnly className={`${inputClass} bg-[var(--surface-muted)] text-[var(--muted)]`} />
      </label>
      <label className="grid gap-2 sm:col-span-2">
        <span className="text-sm font-medium">Connected identity</span>
        <input value={connectedIdentity ?? "—"} readOnly className={`${inputClass} bg-[var(--surface-muted)] text-[var(--muted)]`} />
      </label>
      <div className="sm:col-span-2">
        <button type="button" onClick={() => onSave(name.trim())} disabled={pending || name.trim() === initial} className="button button-primary text-sm disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function WalletEditor({
  address,
  network,
  verified,
  pending,
  error,
  onSave,
}: {
  address: string;
  network: string;
  verified: boolean;
  pending: boolean;
  error: string | null;
  onSave: (addr: string, network: string) => void;
}) {
  const { ready, wallets } = useWallets();
  const { createWallet } = useCreateWallet();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const embedded = getEmbeddedConnectedWallet(wallets);
  const embeddedAddress = embedded?.address ?? "";
  const payoutNetwork = network || "base";
  const isConnected = Boolean(address) && address.toLowerCase() === embeddedAddress.toLowerCase();

  const connect = async () => {
    setLocalError(null);
    let addr = embeddedAddress;
    if (!addr) {
      setBusy(true);
      try {
        const created = await createWallet();
        addr = created?.address ?? "";
      } catch {
        setLocalError("Could not create your wallet. Try again.");
      } finally {
        setBusy(false);
      }
    }
    if (addr) onSave(addr, payoutNetwork);
  };

  const working = busy || pending;
  const shownError = localError ?? error;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Receiving wallet</span>
        {address && <WalletStatePill verified={verified} />}
      </div>

      {address ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3">
          <div className="grid gap-0.5 min-w-0">
            <span className="mono truncate text-sm">{address}</span>
            <span className="text-xs text-[var(--muted)]">
              {isConnected ? "Privy wallet" : "External address"} · {payoutNetwork}
            </span>
          </div>
          {!isConnected && (
            <button type="button" onClick={connect} disabled={working || !ready} className="button button-secondary text-sm disabled:opacity-50">
              {working ? "Connecting…" : "Use my Privy wallet"}
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={connect}
          disabled={working || !ready}
          className="button button-primary inline-flex w-fit items-center gap-2 text-sm disabled:opacity-50"
        >
          <Wallet size={15} aria-hidden="true" /> {working ? "Connecting…" : "Connect wallet"}
        </button>
      )}

      {shownError && <p className="rounded-lg border border-[#e3a2a0] bg-[#fff1f0] px-4 py-3 text-sm text-[#8d2f2d]">{shownError}</p>}
      <p className="rounded-lg border border-[var(--faint)] bg-[var(--surface-muted)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
        Payments for your articles are routed directly to this wallet. Rubicon never takes custody of your funds. Your
        wallet is created and secured by Privy when you sign in.
      </p>
    </div>
  );
}

function DeveloperInfo({ creatorId }: { creatorId: string }) {
  const [open, setOpen] = useState(false);
  const supabaseHost = SUPABASE_URL ? new URL(SUPABASE_URL).host : "Not configured";
  return (
    <Card>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="text-base font-semibold">Developer information</span>
        <ChevronDown size={18} className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="grid gap-3 border-t border-[var(--faint)] p-5 text-sm">
          <DevRow label="Creator ID" value={<code className="mono">{creatorId || "—"}</code>} />
          <DevRow label="Supabase project" value={<code className="mono">{supabaseHost}</code>} />
          <DevRow
            label="Public repository"
            value={
              <a href="https://github.com/michaelzoub/rubicon" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--river-deep)] hover:underline">
                github.com/michaelzoub/rubicon <ExternalLink size={12} aria-hidden="true" />
              </a>
            }
          />
        </div>
      )}
    </Card>
  );
}

function DevRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-baseline gap-4 border-b border-[var(--faint)] pb-3 last:border-0 last:pb-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}
