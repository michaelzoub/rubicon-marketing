import { ArrowUp, Check, Search, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./agent-workflow.module.css";

const session = {
  query: "Find the most relevant evidence about liquidity risk in instant settlement",
  article: "The hidden cost of instant settlement",
  author: "Avery Rowe",
  section: "§2 — The liquidity tradeoff",
  words: "186",
  price: "$0.14",
  budget: "$2.00",
} as const;

function SearchDemo() {
  return (
    <div className={`${styles.demo} ${styles.chatDemo}`} aria-hidden="true">
      <ChatTop state="Working" />
      <div className={styles.chatBody}>
        <div className={styles.userBubble}>Find evidence on liquidity risk in instant settlement.</div>
        <Action label="Searching Rubicon" detail="3 sources found" icon={<Search size={12} />} />
        <div className={styles.searchResponse}>
          <div className={styles.responseLabel}><Sparkles size={11} /> Best match <span>1 of 3</span></div>
          <strong>{session.article}</strong>
          <small>{session.author} · human writing · {session.words} words in match</small>
          <p>Explains why instant settlement can create a timing gap between available liquidity and the next obligation.</p>
          <div className={styles.responseAction}>Preview metadata <span>→</span></div>
        </div>
      </div>
      <Composer text="Ask Rubicon…" />
    </div>
  );
}

function PreviewDemo() {
  return (
    <div className={`${styles.demo} ${styles.chatDemo}`} aria-hidden="true">
      <ChatTop state="Previewing" />
      <div className={styles.chatBody}>
        <div className={styles.userBubble}>Preview the selected article.</div>
        <div className={styles.metadataPreview}>
          <div className={styles.responseLabel}><Sparkles size={11} /> Metadata preview <span>safe to inspect</span></div>
          <strong>{session.article}</strong>
          <small>By {session.author}</small>
          <p>Why fast settlement changes the shape of liquidity risk.</p>
          <div className={styles.metadataHeading}><span>§1</span> Why speed changes the risk <b>free</b></div>
          <div className={`${styles.metadataHeading} ${styles.selectedHeading}`}><span>§2</span> The liquidity tradeoff <b>{session.price}</b></div>
          <div className={styles.metadataHeading}><span>§3</span> Designing for the gap <b>$0.11</b></div>
        </div>
      </div>
      <Composer text="Ask about a section…" />
    </div>
  );
}

function GatewayDemo() {
  return (
    <div className={`${styles.demo} ${styles.chatDemo}`} aria-hidden="true">
      <ChatTop state="Gateway connected" />
      <div className={styles.chatBody}>
        <div className={styles.userBubble}>I need the passage explaining how timing gaps create liquidity risk.</div>
        <div className={styles.gatewayExchange}>
          <div className={styles.gatewayReply}><Sparkles size={11} /><div><span>Gateway agent</span><strong>I found the closest section.</strong><small>{session.section} · {session.words} words</small></div></div>
          <div className={styles.gatewayQuote}>“Liquidity must be available before the next obligation.”</div>
          <div className={styles.gatewayPrice}>{session.price} <span>for this passage</span></div>
        </div>
      </div>
      <Composer text="Ask the gateway…" />
    </div>
  );
}

function ApproveDemo() {
  return (
    <div className={`${styles.demo} ${styles.capDemo}`} aria-hidden="true">
      <ChatTop state="Needs approval" />
      <div className={styles.chatBody}>
        <div className={styles.agentReply}><Sparkles size={13} /><div><span>Ready to purchase</span><strong>{session.section}</strong><small>{session.words} words · {session.price}</small></div></div>
        <div className={styles.userBubble}>Approve the selected passage for <strong>{session.price}</strong>. Keep me within the <strong>{session.budget}</strong> cap.</div>
        <div className={styles.purchaseApproved}><span className={styles.approvedIcon}><Check size={12} /></span><div><strong>Approved · evidence fetched</strong><span>{session.price} charged · {session.budget} cap preserved</span></div><b>7%</b></div>
      </div>
      <Composer text="Ask a follow-up…" />
    </div>
  );
}

function ResultDemo() {
  return (
    <div className={`${styles.demo} ${styles.chatDemo}`} aria-hidden="true">
      <ChatTop state="Complete" />
      <div className={styles.chatBody}>
        <div className={styles.userBubble}>Use the evidence to answer my question.</div>
        <Action label="Evidence fetched" detail={`${session.section} · ${session.price} spent`} icon={<Check size={12} />} />
        <div className={styles.inferenceResponse}><div className={styles.responseLabel}><Sparkles size={11} /> Final response <span>grounded in Rubicon</span></div><p>Instant settlement reduces waiting, but it can expose a liquidity gap: obligations arrive before cash is reliably available. The practical risk is timing, not just solvency.</p><small>Inference from {session.article} · 1 purchased passage</small></div>
      </div>
      <Composer text="Continue research…" />
    </div>
  );
}

function ChatTop({ state }: { state: string }) { return <div className={styles.chatTop}><span className={styles.agentDot} /> Rubicon agent <span>{state}</span></div>; }
function Composer({ text }: { text: string }) { return <div className={styles.chatComposer}><span>{text}</span><span className={styles.sendButton}><ArrowUp size={12} /></span></div>; }
function Action({ label, detail, icon }: { label: string; detail: string; icon?: ReactNode }) { return <div className={styles.agentAction}>{icon ?? <Sparkles size={12} />}<div><strong>{label}</strong><small>{detail}</small></div></div>; }

const steps = [
  { title: "Search", copy: "Prompt your agent so it finds relevant human writing", Demo: SearchDemo },
  { title: "Preview", copy: "Review the free details and pricing.", Demo: PreviewDemo },
  { title: "Ask the gateway", copy: "Locate the smallest relevant passage.", Demo: GatewayDemo },
  { title: "Approve", copy: "Stay within the user’s spending cap.", Demo: ApproveDemo },
  { title: "Final result", copy: "Return a stronger answer grounded in the evidence.", Demo: ResultDemo },
] as const;

export function AgentWorkflow({ pageLead = false }: { pageLead?: boolean }) {
  return (
    <section
      id="agent-workflow"
      className={`landing-section-block ${styles.section}`}
      aria-labelledby="agent-workflow-heading"
      data-analytics-section="agent_workflow"
    >
      <div className={`container ${styles.inner}`}>
        <div className="landing-copy-stack">
          <p className="landing-section-eyebrow">For agents</p>
          {pageLead ? (
            <h1 id="agent-workflow-heading" className={styles.pageTitle}>
              Find the right passage before buying it.
            </h1>
          ) : (
            <h2 id="agent-workflow-heading" className="landing-section-title">
              <span className="landing-section-title-emphasis">Find the right passage before buying it.</span>
              <br />
              <span className="landing-section-title-muted">Useful evidence, without unlocking an entire article.</span>
            </h2>
          )}
          {pageLead && (
            <p className={styles.pageLead}>
              Rubicon lets an agent search and inspect free source information, then asks a gateway agent to locate the
              smallest relevant section. The user’s agent approves the price, unlocks only that passage, and uses it in
              the final answer.
            </p>
          )}
        </div>

        <div className={styles.steps} aria-label="How an agent uses Rubicon">
          {steps.map(({ title, copy, Demo }, index) => (
            <article className={styles.step} key={title}>
              <Demo />
              <div className={styles.stepBody}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AgentComparison() {
  return (
    <section
      className={`landing-section-block ${styles.comparisonSection}`}
      aria-labelledby="agent-comparison-heading"
      data-analytics-section="agent_comparison"
    >
      <div className={`container ${styles.comparisonInner}`}>
        <div className="landing-copy-stack">
          <h2 id="agent-comparison-heading" className="landing-section-title">
            <span className="landing-section-title-emphasis">Rubicon expands what your existing agent can read.</span>
          </h2>
          <p className="landing-section-lead">
            Agents often work from freely indexed pages, repetitive search results, low-context summaries, and whatever
            happens to be available without payment. Rubicon adds more varied human writing to that source pool,
            including expert analysis that may live behind a paywall or on platforms such as Substack.
          </p>
        </div>

        <div className={styles.comparisonGrid}>
          <article className={`${styles.comparisonCard} ${styles.comparisonCardWithout}`}>
            <span className={styles.comparisonLabel}>Public web only</span>
            <h3>Without Rubicon</h3>
            <ul>
              <li><X size={15} aria-hidden="true" />Limited to freely indexed and accessible sources</li>
              <li><X size={15} aria-hidden="true" />Search results can repeat the same underlying claims</li>
              <li><X size={15} aria-hidden="true" />Snippets and summaries may lack the context a task needs</li>
              <li><X size={15} aria-hidden="true" />Useful original analysis may be unavailable without payment</li>
            </ul>
          </article>
          <div className={styles.comparisonSeparator} aria-hidden="true"><span>VS</span></div>
          <article className={`${styles.comparisonCard} ${styles.comparisonCardWith}`}>
            <span className={styles.comparisonLabel}>Paid source layer</span>
            <h3>With Rubicon</h3>
            <ul>
              <li><Check size={15} aria-hidden="true" />Discovers a broader range of human-written sources</li>
              <li><Check size={15} aria-hidden="true" />Reviews free metadata before choosing</li>
              <li><Check size={15} aria-hidden="true" />Selectively purchases only relevant evidence</li>
              <li><Check size={15} aria-hidden="true" />Produces more informed, specific, and grounded answers</li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
