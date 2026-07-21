import styles from "../agent-use-cases.module.css";

const angles = [["CONSENSUS", "Soft landing remains the base case.", "Central-bank survey"], ["CONTRARIAN", "Refinancing pressure is underpriced.", "Credit investor note"], ["PRACTITIONER", "Orders are slowing before reported revenue.", "Industrial operator"], ["ACADEMIC", "Credit impulses lead employment revisions.", "Macro research paper"], ["HISTORICAL", "The setup rhymes with the 2001 rollover cycle.", "Market historian"]] as const;

export function PerspectivesPreview() {
  return <div className={`${styles.preview} ${styles.perspectivesPreview}`} aria-hidden="true"><div className={styles.perspectiveHeader}><span>VIEWPOINT MATRIX</span><span>5 distinct angles · low overlap</span></div><div className={styles.angleStack}>{angles.map(([label, argument, source]) => <div className={styles.angleCard} key={label}><span className={styles.angleLabel}>{label}</span><strong>{argument}</strong><small>{source}</small></div>)}</div><div className={styles.combinationBar}><span>Agent synthesis</span><strong>Combining disagreement, operating evidence, and historical precedent</strong></div></div>;
}
