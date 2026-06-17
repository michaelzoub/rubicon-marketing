"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import { useRubiconMutation, useRubiconQuery } from "@/lib/rubicon/hooks";
import { RUBICON_API_URL } from "@/lib/rubicon/auth";
import { atomicPerWordToPer1000Usd, atomicToUsd, per1000UsdToAtomicPerWord, usdToAtomic } from "@/lib/rubicon/pricing";
import {
  Card,
  CardHeader,
  ErrorState,
  LoadingState,
  PageHeader,
  WalletStatePill,
} from "../_components/ui";

export default function SettingsPage() {
  const { user, logout, linkTwitter } = usePrivy();
  const creator = useRubiconQuery((c) => c.getCreator(), []);
  const wallet = useRubiconQuery((c) => c.getWallet(), []);
  const updateCreator = useRubiconMutation((c, ...a: Parameters<typeof c.updateCreator>) => c.updateCreator(...a));
  const updateWallet = useRubiconMutation((c, addr: string) => c.updateWallet({ address: addr }));

  const xProfile = creator.data?.connectedProfiles.find((p) => p.type === "x");
  const xHandle = xProfile?.handle ?? user?.twitter?.username ?? null;

  return (
    <div className="grid gap-6">
      <PageHeader title="Settings" description="Manage your account, wallet, default pricing, and developer access." />

      {creator.status === "loading" && <LoadingState />}
      {creator.status === "error" && creator.error && <ErrorState error={creator.error} onRetry={creator.refetch} />}

      {creator.status === "success" && (
        <>
          {/* Account */}
          <Card>
            <CardHeader title="Account" />
            <div className="grid gap-4 p-5">
              <AccountName
                initial={creator.data?.name ?? ""}
                email={creator.data?.email ?? user?.email?.address ?? null}
                pending={updateCreator.pending}
                onSave={async (name) => {
                  await updateCreator.run({ name });
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

          {/* Connected profiles */}
          <Card>
            <CardHeader title="Connected profiles" />
            <div className="divide-y divide-[var(--faint)]">
              <div className="flex items-center justify-between gap-4 p-5">
                <div>
                  <div className="font-medium">X account</div>
                  <div className="mt-0.5 text-sm text-[var(--muted)]">{xHandle ? `@${xHandle}` : "Not connected"}</div>
                </div>
                {xHandle ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#69b88c] bg-[#e8f6ef] px-2.5 py-0.5 text-xs font-medium text-[#165c3e]">
                    <ShieldCheck size={13} aria-hidden="true" /> Connected
                  </span>
                ) : (
                  <button type="button" onClick={() => linkTwitter()} className="button button-secondary text-sm">
                    Connect X
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 p-5 opacity-70">
                <div>
                  <div className="font-medium">Substack</div>
                  <div className="mt-0.5 text-sm text-[var(--muted)]">Verify ownership of a Substack publication.</div>
                </div>
                <span className="rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted)]">
                  Coming soon
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
                  state={wallet.data?.verificationState ?? "unverified"}
                  pending={updateWallet.pending}
                  error={updateWallet.error?.message ?? null}
                  onSave={async (addr) => {
                    await updateWallet.run(addr);
                    wallet.refetch();
                  }}
                />
              )}
            </div>
          </Card>

          {/* Default pricing */}
          <Card>
            <CardHeader title="Default pricing" />
            <div className="p-5">
              <DefaultPricing
                defaultPerWord={creator.data?.defaultPricePerWord ?? null}
                defaultMax={creator.data?.defaultMaxArticlePrice ?? null}
                pending={updateCreator.pending}
                onSave={async (perWord, max) => {
                  await updateCreator.run({ defaultPricePerWord: perWord, defaultMaxArticlePrice: max });
                  creator.refetch();
                }}
              />
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
  email,
  pending,
  onSave,
}: {
  initial: string;
  email: string | null;
  pending: boolean;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  useEffect(() => setName(initial), [initial]);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2">
        <span className="text-sm font-medium">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-medium">Connected identity</span>
        <input value={email ?? "—"} readOnly className={`${inputClass} bg-[var(--surface-muted)] text-[var(--muted)]`} />
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
  state,
  pending,
  error,
  onSave,
}: {
  address: string;
  state: import("@/lib/rubicon/types").WalletVerificationState;
  pending: boolean;
  error: string | null;
  onSave: (addr: string) => void;
}) {
  const [value, setValue] = useState(address);
  useEffect(() => setValue(address), [address]);
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Wallet address</span>
        {address && <WalletStatePill state={state} />}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="0x… receiving wallet address" className={`${inputClass} mono flex-1`} />
        <button type="button" onClick={() => onSave(value.trim())} disabled={pending || !value.trim() || value.trim() === address} className="button button-primary text-sm disabled:opacity-50">
          {pending ? "Saving…" : address ? "Change wallet" : "Connect wallet"}
        </button>
      </div>
      {error && <p className="rounded-lg border border-[#e3a2a0] bg-[#fff1f0] px-4 py-3 text-sm text-[#8d2f2d]">{error}</p>}
      <p className="rounded-lg border border-[var(--faint)] bg-[var(--surface-muted)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
        Payments for your articles are routed directly to this wallet. Rubicon never takes custody of your funds. Double-check the address — payments sent to a wrong address can’t be recovered.
      </p>
    </div>
  );
}

function DefaultPricing({
  defaultPerWord,
  defaultMax,
  pending,
  onSave,
}: {
  defaultPerWord: string | null;
  defaultMax: string | null;
  pending: boolean;
  onSave: (perWord: string | null, max: string | null) => void;
}) {
  const [per1000, setPer1000] = useState(defaultPerWord ? atomicPerWordToPer1000Usd(defaultPerWord).toString() : "");
  const [max, setMax] = useState(defaultMax ? atomicToUsd(defaultMax).toString() : "");
  useEffect(() => {
    setPer1000(defaultPerWord ? atomicPerWordToPer1000Usd(defaultPerWord).toString() : "");
    setMax(defaultMax ? atomicToUsd(defaultMax).toString() : "");
  }, [defaultPerWord, defaultMax]);

  return (
    <div className="grid gap-4">
      <p className="text-sm text-[var(--muted)]">New articles start with these values. You can change pricing on each article.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Default price per 1,000 words ($)</span>
          <input value={per1000} onChange={(e) => setPer1000(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="0.01" className={inputClass} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Default maximum article price ($)</span>
          <input value={max} onChange={(e) => setMax(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="No cap" className={inputClass} />
        </label>
      </div>
      <div>
        <button
          type="button"
          onClick={() =>
            onSave(
              per1000 && Number(per1000) > 0 ? per1000UsdToAtomicPerWord(Number(per1000)) : null,
              max && Number(max) > 0 ? usdToAtomic(Number(max)) : null,
            )
          }
          disabled={pending}
          className="button button-primary text-sm disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save defaults"}
        </button>
      </div>
    </div>
  );
}

function DeveloperInfo({ creatorId }: { creatorId: string }) {
  const [open, setOpen] = useState(false);
  const apiBase = RUBICON_API_URL || "https://api.rubicon.dev";
  return (
    <Card>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="text-base font-semibold">Developer information</span>
        <ChevronDown size={18} className={`text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="grid gap-3 border-t border-[var(--faint)] p-5 text-sm">
          <DevRow label="Creator ID" value={<code className="mono">{creatorId || "—"}</code>} />
          <DevRow label="API base URL" value={<code className="mono">{apiBase}</code>} />
          <DevRow
            label="Your articles (API)"
            value={
              <a href={`${apiBase}/v1/creator/articles`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--river-deep)] hover:underline">
                <code className="mono">/v1/creator/articles</code> <ExternalLink size={12} aria-hidden="true" />
              </a>
            }
          />
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
