import chalk from "chalk";
import { writeFileSync, mkdirSync } from "fs";
import { scrapeDuunitori } from "./scrape/duunitori";

const query = process.argv[2] ?? "it";

console.log(chalk.bold(`Scraping jobs for: "${query}"...\n`));

const [duunitori] = await Promise.all([scrapeDuunitori(query)]);

const jobs = [...duunitori];

for (const job of jobs) {
  console.log(chalk.green.bold(job.title));
  console.log(chalk.dim(`${job.company} - ${job.location}`));
  console.log(chalk.cyan(job.url));
  if (job.postedAt) console.log(chalk.gray(job.postedAt));
  console.log();
}

mkdirSync("data", { recursive: true });
writeFileSync("data/jobs.json", JSON.stringify(jobs, null, 2));
console.log(chalk.yellow(`Saved ${jobs.length} jobs to data/jobs.json`));
