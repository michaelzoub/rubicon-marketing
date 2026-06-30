"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { fade } from "./motion";

const LANDING_FAQ = [
  {
    id: "word-level-metering",
    question: "What is word-level metering?",
    answer:
      "Rubicon prices content by the word. Writers set a per-word rate in USDC, and agents pay only for the words that are actually streamed and read—not for the full article upfront.",
  },
  {
    id: "short-reads",
    question: "How do short reads get paid?",
    answer:
      "For quick answers, the gateway streams and settles one word at a time. Each delivered word triggers a tiny USDC payment, so agents can stop the moment they have enough evidence.",
  },
  {
    id: "bundled-payments",
    question: "How does pay-per-word bundle into one payment at scale?",
    answer:
      "For longer reads, the gateway bundles a contiguous run of words into a single chunk released by one payment. That cuts round-trips and speeds delivery while still metering exactly what was read.",
  },
  {
    id: "early-stop",
    question: "Do I earn if an agent stops early?",
    answer:
      "Yes. You earn for exactly the words that were read—whether the agent stops after a definition or continues through multiple sections.",
  },
  {
    id: "on-chain",
    question: "Is every word always a separate payment?",
    answer:
      "Short reads stream and pay word by word. At scale, Rubicon batches consecutive words into bundled payments so micropayments stay practical without losing per-word attribution.",
  },
  {
    id: "micropayments-clear",
    question: "How do thousands of micropayments actually clear?",
    answer:
      "A single word can cost a fraction of a cent. Card rails would lose that to fees, so Rubicon settles every word as a USDC nanopayment—a transfer small enough to move per word, instantly, without a fee swallowing the payment. Writers set the per-word price, and each word settles in USDC with no card fees eating sub-cent amounts.",
  },
  {
    id: "settlement-infrastructure",
    question: "What infrastructure powers settlement?",
    answer:
      "Rubicon runs on Circle's stablecoin infrastructure and Arc, Circle's USDC-native chain where stablecoins are the gas. That makes paying for one word, then another, thousands of times over, economically real.",
  },
] as const;

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="landing-faq-item">
      <button type="button" className="landing-faq-trigger" aria-expanded={open} onClick={onToggle}>
        <span className="landing-faq-question">{question}</span>
        <Plus size={20} strokeWidth={1.75} className={`landing-faq-icon${open ? " landing-faq-icon--open" : ""}`} aria-hidden="true" />
      </button>
      <div className="landing-faq-panel" hidden={!open}>
        <p>{answer}</p>
      </div>
    </div>
  );
}

export function LandingFaq() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className="section landing-section landing-faq" aria-labelledby="landing-faq-heading">
      <motion.div {...fade} className="container landing-faq-layout">
        <h2 id="landing-faq-heading" className="landing-faq-heading">
          FAQs
        </h2>
        <div className="landing-faq-list">
          {LANDING_FAQ.map((item) => (
            <FaqItem
              key={item.id}
              question={item.question}
              answer={item.answer}
              open={openId === item.id}
              onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
