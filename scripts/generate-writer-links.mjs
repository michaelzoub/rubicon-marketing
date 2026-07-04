#!/usr/bin/env node
/**
 * Generate personalized writer-outreach links + DM messages.
 *
 * Usage:
 *   node scripts/generate-writer-links.mjs writers.txt [output.csv]
 *
 * Input: a text file (or single-column CSV) with one username/handle per
 * line. Leading `@` is stripped. Lines starting with `#` and the header row
 * `username` are ignored.
 *
 * Output: CSV with `username,personalized_url,dm_message`, written to stdout
 * or to the optional output path. Base URL comes from NEXT_PUBLIC_SITE_URL
 * (default https://rubiconpay.xyz).
 *
 * See docs/writer-outreach.md for how attribution is captured.
 */

import { readFileSync, writeFileSync } from "node:fs";

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://rubiconpay.xyz").replace(/\/+$/, "");

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath) {
  console.error("Usage: node scripts/generate-writer-links.mjs <writers.txt|csv> [output.csv]");
  process.exit(1);
}

function normalize(line) {
  // Accept "handle", "@handle", or the first column of a CSV row.
  const first = line.split(",")[0].trim();
  return first.replace(/^@+/, "");
}

function personalizedUrl(username) {
  const params = new URLSearchParams({
    ref: "writer_outreach",
    target: username,
    utm_source: "outreach",
    utm_medium: "dm",
    utm_campaign: "writer_pilot",
  });
  return `${BASE_URL}/?${params.toString()}`;
}

function dmMessage(username) {
  return [
    `Hey ${username} — saw you checked out Rubicon / thought your writing would be a strong fit.`,
    "",
    "Quick question: would you be open to listing one article for our mainnet pilot?",
    "",
    "If you’re unsure, I’m mainly trying to learn whether the blocker is setup friction, agent demand skepticism, wallet/mainnet concerns, or something else.",
  ].join("\n");
}

function csvField(value) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const usernames = readFileSync(inputPath, "utf8")
  .split(/\r?\n/)
  .map(normalize)
  .filter((name) => name && !name.startsWith("#") && name.toLowerCase() !== "username");

if (!usernames.length) {
  console.error(`No usernames found in ${inputPath}.`);
  process.exit(1);
}

const rows = [
  "username,personalized_url,dm_message",
  ...usernames.map((username) =>
    [username, personalizedUrl(username), dmMessage(username)].map(csvField).join(","),
  ),
];
const csv = rows.join("\n") + "\n";

if (outputPath) {
  writeFileSync(outputPath, csv);
  console.error(`Wrote ${usernames.length} links to ${outputPath}`);
} else {
  process.stdout.write(csv);
}
