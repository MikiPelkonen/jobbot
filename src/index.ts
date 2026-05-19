import chalk from "chalk";
import { writeFileSync, mkdirSync } from "fs";
import { scrapeDuunitori, scrapeJobDetails } from "./scrape";
import { scoreJobs } from "./score";
import type { Job } from "./types";

const args = process.argv.slice(2);

const ARGS = {
  queries: (args.find((a) => !a.startsWith("--")) ?? "it support")
    .split(",")
    .map((q) => q.trim())
    .filter(Boolean),
  withDetails: args.includes("--details"),
  save: !args.includes("--no-save"),
  limit: Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 0),
} as const;

const OUT_DIR = "data";
const OUT_FILE = `${OUT_DIR}/jobs.json`;

function scoreColor(score: number) {
  if (score >= 50) return chalk.green.bold(`Score: ${score}`);
  if (score >= 25) return chalk.yellow(`Score: ${score}`);
  return chalk.dim(`Score: ${score}`);
}

const FIELD_DISPLAY: Partial<Record<keyof Job, (v: unknown) => string>> = {
  score: (v) => scoreColor(v as number),
  matchedKeywords: (v) => chalk.dim(`Matched: ${(v as string[]).join(", ")}`),
  postedAt: (v) => chalk.dim(`Posted: ${v}`),
  deadline: (v) => chalk.red(`Deadline: ${v}`),
  salary: (v) => chalk.yellow(`Salary: ${v}`),
  badge: (v) => chalk.magenta(String(v)),
  contactEmail: (v) => chalk.cyan(`Email: ${v}`),
  contactPhone: (v) => chalk.cyan(`Phone: ${v}`),
  applyUrl: (v) => chalk.blue(`Apply: ${v}`),
  status: (v) => chalk.yellow(`Status: ${v}`),
  description: (v) => chalk.white(String(v).slice(0, 300) + "..."),
};

function printJob(job: Job) {
  console.log(chalk.green.bold(job.title));
  console.log(chalk.dim(`${job.company} — ${job.location}`));

  for (const [key, format] of Object.entries(FIELD_DISPLAY)) {
    const value = job[key as keyof Job];
    if (value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)) {
      console.log(format(value));
    }
  }

  console.log(chalk.dim(job.url));
  console.log();
}

function printJobs(jobs: Job[]) {
  if (!jobs.length) {
    console.log(chalk.red("No jobs found."));
    return;
  }
  console.log(chalk.bold(`Found ${jobs.length} jobs:\n`));
  jobs.forEach(printJob);
}

function saveJobs(jobs: Job[]) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(jobs, null, 2));
  console.log(chalk.yellow(`Saved ${jobs.length} jobs -> ${OUT_FILE}`));
}

console.log(
  chalk.bold(
    `Scraping: ${ARGS.queries.map((q) => `"${q}"`).join(", ")}${ARGS.withDetails ? " (with details)" : ""}\n`,
  ),
);

// Scrape all queries and deduplicate by URL
const seen = new Set<string>();
let jobs: Job[] = [];

for (const query of ARGS.queries) {
  const results = await scrapeDuunitori(query);
  for (const job of results) {
    if (!seen.has(job.url)) {
      seen.add(job.url);
      jobs.push(job);
    }
  }
}

if (ARGS.limit > 0) jobs = jobs.slice(0, ARGS.limit);

if (ARGS.withDetails) {
  console.log(chalk.dim(`Fetching details for ${jobs.length} jobs...`));
  const enriched: Job[] = [];
  for (const job of jobs) {
    try {
      const detail = await scrapeJobDetails(job);
      enriched.push(detail);
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      enriched.push(job);
    }
  }
  jobs = enriched;
}

jobs = await scoreJobs(jobs);

if (ARGS.save) saveJobs(jobs);
printJobs(jobs);
