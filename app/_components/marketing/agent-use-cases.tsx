import styles from "./agent-use-cases.module.css";
import { MarketsPreview } from "./agent-use-cases/markets-preview";
import { OptimizationPreview } from "./agent-use-cases/optimization-preview";
import { PerspectivesPreview } from "./agent-use-cases/perspectives-preview";
import { ResearchPreview } from "./agent-use-cases/research-preview";

const useCases = [
  { title: "Research", description: "Compare expert work, select decisive evidence, and build a literature review with arguments the public-web baseline missed.", Preview: ResearchPreview },
  { title: "Optimization", description: "Use technical evidence to form better hypotheses, test them against an evaluator, and improve the candidate instead of iterating blindly.", Preview: OptimizationPreview },
  { title: "Unique angles", description: "Make consensus, contrarian, practitioner, academic, and historical perspectives visible before the agent combines them.", Preview: PerspectivesPreview },
  { title: "Economic & finance commentary", description: "Bring a credible specialist thesis, market context, and supporting signals into the agent’s analysis.", Preview: MarketsPreview },
] as const;

export function AgentUseCases() {
  return (
    <section className={`landing-section-block ${styles.section}`} aria-labelledby="agent-use-cases-heading" data-analytics-section="agent_use_cases">
      <div className={`container ${styles.inner}`}>
        <div className={styles.headingBlock}>
          <p className="landing-section-eyebrow">Better inputs, better outputs</p>
          <h2 id="agent-use-cases-heading" className={styles.heading}>Give agents better material to reason from.</h2>
          <p className={styles.lead}>Agents are only as thoughtful as the material they can reach. Rubicon expands the source pool with high-signal human writing, producing work that is more informed, specific, and grounded.</p>
        </div>
        <div className={styles.grid}>
          {useCases.map(({ title, description, Preview }) => <article className={styles.card} key={title}><Preview /><div className={styles.cardBody}><h3>{title}</h3><p>{description}</p></div></article>)}
        </div>
      </div>
    </section>
  );
}
