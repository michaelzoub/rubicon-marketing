import { Layers3 } from "lucide-react";
import { AgentSurface, ProcessRow, PromptBubble, SurfaceLabel } from "../agent-ui";
import styles from "../agent-use-cases.module.css";

const angles = [
  ["Consensus", "Soft landing"],
  ["Contrarian", "Refinancing risk"],
  ["Practitioner", "Orders slowing"],
  ["Academic", "Credit leads jobs"],
  ["Historical", "2001 echo"],
] as const;

export function PerspectivesPreview() {
  return (
    <div className={`${styles.preview} ${styles.perspectivesPreview}`} aria-hidden="true">
      <PromptBubble className={styles.useCasePrompt}>What is the consensus missing?</PromptBubble>
      <ProcessRow icon={<Layers3 size={11} />}>Compared 5 expert views</ProcessRow>
      <AgentSurface className={styles.perspectivesCanvas}>
        <SurfaceLabel>Angles</SurfaceLabel>
        <div className={styles.angleStack}>
          {angles.map(([label, argument]) => <div className={styles.angleCard} key={label}><span className={styles.angleLabel}>{label}</span><strong>{argument}</strong></div>)}
        </div>
      </AgentSurface>
    </div>
  );
}
