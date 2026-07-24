import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { AgentSurface, ProcessRow, PromptBubble, SurfaceLabel } from "../agent-ui";
import styles from "../agent-use-cases.module.css";

const scoreData = [
  { run: "01", score: 0.61 }, { run: "02", score: 0.64 }, { run: "03", score: 0.68 },
  { run: "04", score: 0.66 }, { run: "05", score: 0.71 }, { run: "06", score: 0.70 },
  { run: "07", score: 0.75 }, { run: "08", score: 0.77 }, { run: "09", score: 0.76 },
  { run: "10", score: 0.79 }, { run: "11", score: 0.80 },
];

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
        <div className={styles.performanceChart} role="img" aria-label="Performance rises unevenly from 0.61 to 0.80 across ten strategies, including three backtracks">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scoreData} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
              <defs><linearGradient id="optimization-area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#2f73bb" stopOpacity=".2"/><stop offset="1" stopColor="#2f73bb" stopOpacity="0"/></linearGradient></defs>
              <CartesianGrid vertical stroke="rgba(47, 115, 187, 0.1)" strokeDasharray="2 5" />
              <XAxis dataKey="run" axisLine={false} tickLine={false} tick={false} />
              <YAxis hide domain={[0.58, 0.82]} />
              <Area type="stepAfter" dataKey="score" stroke="#2f73bb" strokeWidth={2.25} fill="url(#optimization-area)" dot={false} activeDot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AgentSurface>
    </div>
  );
}
