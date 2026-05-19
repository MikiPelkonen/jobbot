import chalk from "chalk";
import { writeFileSync, mkdirSync } from "fs";
import { scrapeDuunitori } from "./scrape";
import { scoreJobs } from "./score";
import { generateCoverLetter } from "./generate";
import type { Job } from "./types";

const args = process.argv.slice(2);

const ARGS = {
  queries: (args.find((a) => !a.startsWith("--")) ?? "it support")
    .split(",")
    .map((q) => q.trim())
    .filter(Boolean),
  top: Number(args.find((a) => a.startsWith("--top="))?.split("=")[1] ?? 5),
  minScore: Number(args.find((a) => a.startsWith("--min-score="))?.split("=")[1] ?? 10),
} as const;

const OUT_DIR = "data/apply";

function slug(job: Job): string {
  return `${job.company}-${job.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);
}

function separator(label: string) {
  const line = "=".repeat(60);
  console.log(chalk.cyan(`\n${line}`));
  console.log(chalk.cyan.bold(label));
  console.log(chalk.cyan(line));
}

console.log(chalk.bold(`Scraping: ${ARGS.queries.map((q) => `"${q}"`).join(", ")}\n`));

// Scrape + deduplicate
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

// Score + filter + take top N
jobs = (await scoreJobs(jobs)).filter((j) => (j.score ?? 0) >= ARGS.minScore).slice(0, ARGS.top);

if (!jobs.length) {
  console.log(chalk.red("No jobs met the minimum score threshold."));
  process.exit(0);
}

console.log(chalk.bold(`Generating cover letters for top ${jobs.length} jobs...\n`));
mkdirSync(OUT_DIR, { recursive: true });

for (const job of jobs) {
  const label = `${job.title} @ ${job.company} (score: ${job.score})`;
  process.stdout.write(chalk.dim(`Generating: ${label}...`));

  try {
    const letter = await generateCoverLetter(job);
    const filename = `${OUT_DIR}/${slug(job)}.txt`;
    writeFileSync(filename, `${job.title} @ ${job.company}\n${job.url}\n\n${letter}\n`);

    separator(label);
    console.log(chalk.white(letter));
    console.log(chalk.dim(`\nSaved -> ${filename}`));
  } catch (e) {
    console.log(chalk.red(` FAILED: ${(e as Error).message}`));
  }
}

console.log(chalk.green.bold(`\nDone. Files saved in ${OUT_DIR}/`));
