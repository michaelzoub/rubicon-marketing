import styles from "./agent-use-cases.module.css";
import { MarketsPreview } from "./agent-use-cases/markets-preview";
import { OptimizationPreview } from "./agent-use-cases/optimization-preview";
import { PerspectivesPreview } from "./agent-use-cases/perspectives-preview";
import { ResearchPreview } from "./agent-use-cases/research-preview";

const useCases = [
  { title: "Research", Preview: ResearchPreview },
  { title: "Optimization", Preview: OptimizationPreview },
  { title: "Unique angles", Preview: PerspectivesPreview },
  { title: "Economic & finance commentary", Preview: MarketsPreview },
] as const;

export function AgentUseCases() {
  return (
    <section className={`landing-section-block ${styles.section}`} aria-labelledby="agent-use-cases-heading" data-analytics-section="agent_use_cases">
      <div className={`container ${styles.inner}`}>
        <div className="landing-copy-stack">
          <p className="landing-section-eyebrow">Better inputs, better outputs</p>
          <h2 id="agent-use-cases-heading" className="landing-section-title">
            <span className="landing-section-title-emphasis">Give agents better material to reason from.</span>
          </h2>
          <p className={styles.lead}>
            Rubicon is currently focused on high-quality tech, finance, and economic writing.
          </p>
        </div>
        <div className={styles.grid}>
          {useCases.map(({ title, Preview }) => <article className={styles.card} key={title}><Preview /><div className={styles.cardBody}><h3>{title}</h3></div></article>)}
        </div>
      </div>
    </section>
  );
}
