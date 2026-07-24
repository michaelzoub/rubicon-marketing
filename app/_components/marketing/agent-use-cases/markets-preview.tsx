"use client";

import { LineChart } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { AgentSurface, ProcessRow, PromptBubble } from "../agent-ui";
import styles from "../agent-use-cases.module.css";

export function MarketsPreview() {
  const maturityData = [
    { year: "2024", value: 28 }, { year: "2025", value: 34 }, { year: "2026", value: 52 }, { year: "2027", value: 94 },
  ];

  return (
    <div className={`${styles.preview} ${styles.marketsPreview}`} aria-hidden="true">
      <PromptBubble className={styles.useCasePrompt}>What does the 2027 maturity wall imply?</PromptBubble>
      <ProcessRow icon={<LineChart size={11} />}>Checked the specialist note</ProcessRow>
      <AgentSurface className={`${styles.useCaseResult} ${styles.marketResult}`}>
        <div className={styles.marketSource}>
          <span className={styles.authorMark}>NC</span>
          <div><strong>Northstar Credit</strong><small>Specialist credit research</small></div>
        </div>
        <div className={styles.marketTakeaway}>
          <span className={styles.marketTakeawayLabel}>Key takeaway</span>
          <strong>$94B comes due by 2027. Weaker issuers face the squeeze.</strong>
        </div>
        <div className={styles.signalPanel}>
          <div className={styles.signalLabel}><span>Maturities due</span><strong>2024–27</strong></div>
          <div className={styles.marketChart} role="img" aria-label="Maturities due rise from 28 billion dollars in 2024 to 94 billion dollars in 2027">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={maturityData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs><linearGradient id="maturity-area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#438f68" stopOpacity=".28"/><stop offset="1" stopColor="#438f68" stopOpacity="0"/></linearGradient></defs>
                <CartesianGrid vertical stroke="rgba(67, 143, 104, 0.14)" strokeDasharray="2 5" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: "#789083", fontSize: 8 }} tickMargin={5} />
                <YAxis hide domain={[0, 100]} />
                <Area type="monotone" dataKey="value" stroke="#438f68" strokeWidth={2.25} fill="url(#maturity-area)" dot={false} activeDot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </AgentSurface>
    </div>
  );
}
