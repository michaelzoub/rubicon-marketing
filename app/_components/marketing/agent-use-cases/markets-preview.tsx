import { LineChart } from "lucide-react";
import { AgentSurface, ProcessRow, PromptBubble, SurfaceLabel } from "../agent-ui";
import styles from "../agent-use-cases.module.css";

export function MarketsPreview() {
  return (
    <div className={`${styles.preview} ${styles.marketsPreview}`} aria-hidden="true">
      <PromptBubble className={styles.useCasePrompt}>What does the 2027 maturity wall imply?</PromptBubble>
      <ProcessRow icon={<LineChart size={11} />}>Checked the specialist note</ProcessRow>
      <AgentSurface className={`${styles.useCaseResult} ${styles.marketResult}`}>
        <div className={styles.marketSource}>
          <span className={styles.authorMark}>EM</span>
          <div><SurfaceLabel>Source</SurfaceLabel><strong>Northstar Credit</strong></div>
        </div>
        <div className={styles.marketTakeaway}>
          <SurfaceLabel>Takeaway</SurfaceLabel>
          <strong>$94B comes due by 2027. Weaker issuers face the squeeze.</strong>
        </div>
        <div className={styles.signalPanel}>
          <div className={styles.signalLabel}><span>Maturities due</span><strong>2024–27</strong></div>
          <svg viewBox="0 0 260 76" preserveAspectRatio="none" role="img" aria-label="Maturities due rise sharply through 2027">
            <defs><linearGradient id="maturity-area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#52a87d" stopOpacity=".38"/><stop offset="1" stopColor="#52a87d" stopOpacity="0"/></linearGradient></defs>
            <path className={styles.chartArea} d="M0 64 L42 59 L84 54 L126 45 L168 34 L210 16 L260 7 L260 76 L0 76 Z" />
            <path className={styles.chartLine} d="M0 64 L42 59 L84 54 L126 45 L168 34 L210 16 L260 7" />
          </svg>
          <div className={styles.chartAxis}><span>2024</span><span>2025</span><span>2026</span><span>2027</span></div>
        </div>
      </AgentSurface>
    </div>
  );
}
