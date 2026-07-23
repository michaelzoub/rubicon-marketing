import { TrendingUp } from "lucide-react";
import { AgentSurface, ProcessRow, PromptBubble, SurfaceLabel } from "../agent-ui";
import styles from "../agent-use-cases.module.css";

const points = [["20", "154"], ["66", "139"], ["112", "122"], ["158", "132"], ["204", "105"], ["250", "113"], ["296", "84"], ["342", "68"], ["388", "76"], ["434", "47"], ["480", "32"]] as const;

export function OptimizationPreview() {
  return (
    <div className={`${styles.preview} ${styles.optimizationPreview}`} aria-hidden="true">
      <PromptBubble className={styles.useCasePrompt}>Can you optimize against this grader?</PromptBubble>
      <ProcessRow icon={<TrendingUp size={11} />}>Evaluated 10 strategies</ProcessRow>
      <AgentSurface className={`${styles.useCaseResult} ${styles.optimizationResult}`}>
        <div className={styles.resultHeading}>
          <SurfaceLabel>Score</SurfaceLabel>
          <b>0.61 → 0.80</b>
        </div>
        <div className={styles.performanceChart}>
          <svg viewBox="0 0 500 190" preserveAspectRatio="none" role="img" aria-label="Performance rises unevenly from 0.61 to 0.80 across ten strategies, including three backtracks">
            <line className={styles.gridLine} x1="20" y1="32" x2="480" y2="32" />
            <line className={styles.gridLine} x1="20" y1="75" x2="480" y2="75" />
            <line className={styles.gridLine} x1="20" y1="118" x2="480" y2="118" />
            <line className={styles.targetLine} x1="20" y1="58" x2="480" y2="58" />
            <path className={styles.performanceArea} d="M20 154 L66 139 L112 122 L158 132 L204 105 L250 113 L296 84 L342 68 L388 76 L434 47 L480 32 V180 H20 Z" />
            <path className={styles.performanceLine} d="M20 154 L66 139 L112 122 L158 132 L204 105 L250 113 L296 84 L342 68 L388 76 L434 47 L480 32" />
            {points.map(([cx, cy]) => <circle key={cx} className={styles.performancePoint} cx={cx} cy={cy} r="3.5" />)}
          </svg>
          <div className={styles.chartXaxis}><span>Baseline</span><span>Strategy 10</span></div>
        </div>
      </AgentSurface>
    </div>
  );
}
