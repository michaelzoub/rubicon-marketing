import { ArrowRight, Database, Gauge, Github, Layers3 } from "lucide-react";
import Link from "next/link";
import { listActiveServices } from "@/lib/registry";

const githubUrl = "https://github.com/michaelzoub/rubicon";

export default async function DashboardPage() {
  const services = await listActiveServices();

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--faint)] bg-white/70">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Layers3 size={20} className="text-[var(--river)]" aria-hidden="true" />
            Rubicon Registry
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-[var(--muted)] hover:text-[var(--ink)]">
              Marketing
            </Link>
            <a href={githubUrl} className="button button-primary">
              <Github size={15} aria-hidden="true" /> GitHub
            </a>
          </div>
        </div>
      </header>

      <section className="container py-14">
        <p className="eyebrow">Service Discovery</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <h1 className="section-title">Existing Services.</h1>
            <p className="section-copy mt-4">
              Agents discover active services from the registry, then open a budgeted metered session with the returned service ID.
            </p>
          </div>
          <div className="border border-[var(--line)] bg-white p-4">
            <div className="mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--muted)]">Agent session start</div>
            <pre className="mono mt-3 overflow-x-auto bg-[#0f1519] p-4 text-xs leading-6 text-[#dff4fb]">
              <code>{`await rubicon.run({
  serviceId: "gpu-image-generation",
  input,
  maxSpend: "0.10"
});`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        {services.length === 0 ? (
          <div className="border border-[var(--line)] bg-white p-10">
            <Database size={24} className="text-[var(--river)]" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-semibold">No services registered.</h2>
            <p className="mt-3 max-w-xl text-[var(--muted)]">
              Register a provider through the Provider SDK, assign a stable service ID, and declare pricing before agents can discover it.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <article key={service.id} className="border border-[var(--line)] bg-white">
                <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
                  <div>
                    <div className="mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--river-deep)]">{service.id}</div>
                    <h2 className="mt-2 text-2xl font-semibold">{service.name}</h2>
                    <p className="mt-3 leading-7 text-[var(--muted)]">{service.description}</p>
                  </div>
                  <dl className="grid gap-3 text-sm">
                    <DashboardField label="Provider" value={service.provider.name} />
                    <DashboardField label="Pricing" value={`$${service.pricing.pricePerUnit} / ${service.meteringUnit}`} />
                    <DashboardField label="Gateway fee" value={`${service.pricing.gatewayFeePercent}%`} />
                    <DashboardField label="Status" value={service.status} />
                  </dl>
                  <div>
                    <div className="mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--muted)]">Capabilities</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {service.capabilities.map((capability) => (
                        <span key={capability} className="border border-[var(--faint)] px-2 py-1 text-xs text-[var(--muted)]">
                          {capability}
                        </span>
                      ))}
                    </div>
                    <Link href={`/api/services/${service.id}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--river-deep)]">
                      View discovery payload <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
                <div className="grid border-t border-[var(--faint)] text-sm md:grid-cols-2">
                  <div className="border-b border-[var(--faint)] p-5 md:border-b-0 md:border-r">
                    <div className="flex items-center gap-2 font-semibold">
                      <Gauge size={16} className="text-[var(--river)]" aria-hidden="true" />
                      Input
                    </div>
                    <p className="mt-2 text-[var(--muted)]">{service.input.schemaSummary}</p>
                    <p className="mono mt-3 text-xs text-[var(--muted)]">required: {service.input.required.join(", ")}</p>
                  </div>
                  <div className="p-5">
                    <div className="font-semibold">Output events</div>
                    <p className="mono mt-2 text-xs leading-6 text-[var(--muted)]">{service.output.streamEvents.join(" · ")}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function DashboardField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-[var(--faint)] pb-2">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="mono text-right">{value}</dd>
    </div>
  );
}
