import { Check, LockKeyhole, Search } from "lucide-react";
import { AgentSurface, ProcessRow, PromptBubble, SurfaceLabel } from "./agent-ui";
import styles from "./agent-workflow.module.css";

const session = {
  article: "The hidden cost of instant settlement",
  section: "The liquidity tradeoff",
  words: "186 words",
  price: "$0.14",
  budget: "$2.00",
} as const;

function SearchDemo() {
  return (
    <div className={styles.demo} aria-hidden="true">
      <div className={styles.chatBody}>
        <PromptBubble>Find evidence on instant-settlement liquidity risk.</PromptBubble>
        <ProcessRow icon={<Search size={11} />}>Searching Rubicon</ProcessRow>
        <AgentSurface className={styles.responseSurface}>
          <SurfaceLabel>Best match</SurfaceLabel>
          <strong>{session.article}</strong>
          <p>Fast settlement can expose a timing gap between cash and obligations.</p>
        </AgentSurface>
      </div>
    </div>
  );
}

function PreviewDemo() {
  return (
    <div className={styles.demo} aria-hidden="true">
      <div className={styles.chatBody}>
        <AgentSurface className={`${styles.responseSurface} ${styles.previewResponse}`}>
          <SurfaceLabel>Article structure</SurfaceLabel>
          <strong>{session.article}</strong>
          <div className={styles.sectionChoice}><span>Why speed changes the risk</span><strong>$0.08</strong></div>
          <div className={`${styles.sectionChoice} ${styles.sectionChoiceSelected}`}>
            <span>{session.section}<small>Relevant</small></span><strong>{session.price}</strong>
          </div>
          <div className={styles.sectionChoice}><span>Designing for the gap</span><strong>$0.11</strong></div>
        </AgentSurface>
      </div>
    </div>
  );
}

function GatewayDemo() {
  return (
    <div className={`${styles.demo} ${styles.gatewayDemo}`} aria-hidden="true">
      <div className={styles.chatBody}>
        <div className={styles.buyerAgentMessage}>
          <SurfaceLabel>Buyer agent</SurfaceLabel>
          <p>Which passage explains the timing gap?</p>
        </div>
        <ProcessRow>Buyer agent → Gateway agent</ProcessRow>
        <AgentSurface className={styles.responseSurface}>
          <div className={styles.responseHeading}>
            <div><SurfaceLabel>Gateway agent</SurfaceLabel><strong>{session.section}</strong></div>
            <span>{session.price}</span>
          </div>
          <blockquote>“Liquidity must be available before the next obligation arrives.”</blockquote>
          <small>{session.words}</small>
        </AgentSurface>
      </div>
    </div>
  );
}

function ApproveDemo() {
  return (
    <div className={styles.demo} aria-hidden="true">
      <div className={styles.chatBody}>
        <PromptBubble>Approve {session.price}. Stay under {session.budget}.</PromptBubble>
        <ProcessRow icon={<LockKeyhole size={11} />}>Checking spend policy</ProcessRow>
        <AgentSurface className={`${styles.responseSurface} ${styles.approvalSurface}`}>
          <div>
            <div className={styles.approvalHeading}><SurfaceLabel>Approved</SurfaceLabel></div>
            <strong>{session.price} authorized</strong>
            <small>$1.86 remaining</small>
          </div>
          <span className={styles.approvalMark}><Check size={9} /></span>
        </AgentSurface>
      </div>
    </div>
  );
}

function ResultDemo() {
  return (
    <div className={`${styles.demo} ${styles.evidenceDemo}`} aria-hidden="true">
      <div className={styles.chatBody}>
          <AgentSurface className={`${styles.responseSurface} ${styles.evidenceResponse}`}>
          <SurfaceLabel>Evidence unlocked</SurfaceLabel>
          <strong>Grounded answer</strong>
          <p className={styles.answerText}>Instant settlement can create a liquidity gap when obligations arrive before cash. The risk is timing, not solvency.</p>
        </AgentSurface>
      </div>
    </div>
  );
}

const steps = [
  { title: "Search", Demo: SearchDemo },
  { title: "Preview", Demo: PreviewDemo },
  { title: "Ask the gateway", Demo: GatewayDemo },
  { title: "Approve", Demo: ApproveDemo },
  { title: "Use the evidence", Demo: ResultDemo },
] as const;

export function AgentWorkflow({ pageLead = false }: { pageLead?: boolean }) {
  return (
    <section id="agent-workflow" className={`landing-section-block ${styles.section}`} aria-labelledby="agent-workflow-heading" data-analytics-section="agent_workflow">
      <div className={`container ${styles.inner}`}>
        <div className="landing-copy-stack">
          <p className="landing-section-eyebrow">For agents</p>
          {pageLead ? (
            <h1 id="agent-workflow-heading" className={styles.pageTitle}>Find the right passage before buying it.</h1>
          ) : (
            <h2 id="agent-workflow-heading" className="landing-section-title">
              <span className="landing-section-title-emphasis">Find the right passage before buying it.</span><br />
              <span className="landing-section-title-muted">Useful evidence, without unlocking an entire article.</span>
            </h2>
          )}
          {pageLead ? <p className={styles.pageLead}>Rubicon lets an agent inspect source information, ask a gateway for the smallest relevant section, approve its price, and use the passage in a final answer.</p> : null}
        </div>

        <div className={styles.steps} aria-label="How an agent uses Rubicon">
          {steps.map(({ title, Demo }, index) => (
            <article className={styles.step} key={title}>
              <Demo />
              <div className={styles.stepBody}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <h3>{title}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
