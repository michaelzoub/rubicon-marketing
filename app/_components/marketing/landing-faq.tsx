"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { trackClick } from "../analytics-links";
import { fade } from "./motion";

const LANDING_FAQ_GROUPS = [
  {
    id: "creators",
    label: "Creators",
    items: [
      {
        id: "content-safety",
        question: "How does Rubicon keep my content safe?",
        answer:
          "Your full content is stored securely and is not exposed to buyer agents upfront. Agents can only see safe metadata, such as the article title, description, headers, and pricing. When an agent needs information, Rubicon helps route it toward the relevant section without revealing the full article for free. Paid access is handled incrementally, so agents only receive the content they pay for.",
      },
      {
        id: "earn-money",
        question: "How do I earn money?",
        answer:
          "You set the price for your content, either per word, per section, or per block depending on the article format. When an agent accesses your writing, payment is handled through x402 and settled to your wallet.",
      },
      {
        id: "crypto-payments",
        question: "Why use crypto payments?",
        answer:
          "Agents need a payment rail that is programmable, permissionless, and works for very small transactions. With x402 and USDC, agents can pay for content directly without relying on card flows, subscriptions, or manual checkout pages.",
      },
      {
        id: "full-article-access",
        question: "Can agents see my full article?",
        answer:
          "Not by default. Agents can only access metadata before paying. The article content is released incrementally based on what the agent requests and pays for.",
      },
      {
        id: "publishing-flow",
        question: "Do I need to change how I publish?",
        answer:
          "No. Rubicon is designed to work alongside your existing publishing flow. You can upload or connect selected pieces of writing and choose what you want to make available to agents.",
      },
      {
        id: "best-content",
        question: "What kind of content works best?",
        answer:
          "High-signal writing that agents cannot easily get from public search: research, market analysis, technical posts, expert commentary, paid newsletters, reports, and deep dives.",
      },
    ],
  },
  {
    id: "agents",
    label: "Agents",
    items: [
      {
        id: "why-pay",
        question: "Why should my agent pay for articles when free content already exists online?",
        answer:
          "Free online content is often noisy, shallow, outdated, or AI-generated. Rubicon gives agents access to higher-signal writing from trusted creators, newsletters, research sources, and expert publishers.",
      },
      {
        id: "better-outputs",
        question: "How does Rubicon improve agent outputs?",
        answer:
          "Agents get access to specific sections of quality writing instead of relying only on public search results or summaries. Better source material should lead to better reasoning, better citations, and more useful answers.",
      },
      {
        id: "quality",
        question: "How do you ensure the writing is high quality?",
        answer:
          "Early creators are hand-picked by Rubicon. Over time, Rubicon will use evaluations to measure whether paid sources produce better outcomes than free public content for specific agent tasks.",
      },
      {
        id: "before-paying",
        question: "What does an agent see before paying?",
        answer:
          "Agents can see safe metadata such as the article title, author, description, headers, price, and available sections. They do not get the full article until they pay for access.",
      },
      {
        id: "payment",
        question: "How does payment work?",
        answer:
          "Agents request access through Rubicon's API or SDK. Payments are handled through x402, allowing the agent to pay incrementally for the content it consumes.",
      },
      {
        id: "agent-types",
        question: "What kinds of agents should use Rubicon?",
        answer:
          "Research agents, market analysis agents, coding agents, writing assistants, due diligence tools, and any agent that benefits from credible, high-signal private or paywalled content.",
      },
    ],
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
      <button
        type="button"
        className="landing-faq-trigger"
        aria-expanded={open}
        onClick={() => {
          trackClick("faq_item_toggled", { question: question.slice(0, 60), action: open ? "close" : "open" });
          onToggle();
        }}
      >
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
  const [openByGroup, setOpenByGroup] = useState<Record<string, string | null>>({
    creators: "content-safety",
    agents: "why-pay",
  });

  return (
    <section className="landing-section-block landing-faq" aria-labelledby="landing-faq-heading" data-analytics-section="faq">
      <motion.div {...fade} className="container landing-faq-layout">
        <div className="landing-faq-groups">
          {LANDING_FAQ_GROUPS.map((group) => (
            <div key={group.id} className="landing-faq-group">
              <h3 className="landing-faq-group-title">{group.label}</h3>
              <div className="landing-faq-list">
                {group.items.map((item) => (
                  <FaqItem
                    key={item.id}
                    question={item.question}
                    answer={item.answer}
                    open={openByGroup[group.id] === item.id}
                    onToggle={() =>
                      setOpenByGroup((current) => ({
                        ...current,
                        [group.id]: current[group.id] === item.id ? null : item.id,
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
