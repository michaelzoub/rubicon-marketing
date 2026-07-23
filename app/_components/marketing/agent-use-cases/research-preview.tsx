import { Search } from "lucide-react";
import { AgentSurface, ProcessRow, PromptBubble, SurfaceLabel } from "../agent-ui";
import styles from "../agent-use-cases.module.css";

export function ResearchPreview() {
  return (
    <div className={`${styles.preview} ${styles.researchPreview}`} aria-hidden="true">
      <PromptBubble className={styles.useCasePrompt}>What is the claimed counterexample to the Jacobian conjecture?</PromptBubble>
      <ProcessRow icon={<Search size={11} />}>Thought for 93 min</ProcessRow>
      <AgentSurface className={`${styles.useCaseResult} ${styles.researchResult}`}>
        <SurfaceLabel>Answer</SurfaceLabel>
        <p>As written, the claimed <strong>C³ map appears to work</strong>: det JF = −2 and three inputs share one output. It still needs independent verification.</p>
        <div className={styles.sourceTrail}><span>Levent Alpöge on X</span></div>
      </AgentSurface>
    </div>
  );
}
