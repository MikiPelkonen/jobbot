import type { Job } from "./types";

// Keyword → score weight. Checked against lowercased title / description / tags.
const TITLE_WEIGHTS: [string, number][] = [
  ["it support", 30],
  ["it specialist", 30],
  ["it-tuki", 30],
  ["helpdesk", 25],
  ["help desk", 25],
  ["service desk", 25],
  ["unity", 30],
  ["game developer", 25],
  ["game dev", 25],
  ["peliohjelmoija", 25],
  ["pelikehittäjä", 25],
  ["liveops", 25],
  ["live ops", 25],
  ["quality assurance", 20],
  [" qa ", 20],
  ["game tester", 20],
  ["technical support", 20],
  ["c#", 15],
  ["linux", 12],
  ["tester", 10],
  ["developer", 5],
  ["support", 5],
];

const DESC_WEIGHTS: [string, number][] = [
  ["unity", 15],
  ["c#", 10],
  ["liveops", 12],
  ["live ops", 12],
  ["game industry", 10],
  ["it support", 10],
  ["linux", 8],
  ["quality assurance", 8],
  ["technical support", 8],
  ["game", 4],
];

const FINLAND_LOCATIONS = [
  "helsinki",
  "espoo",
  "tampere",
  "turku",
  "oulu",
  "jyväskylä",
  "vantaa",
  "suomi",
  "finland",
];

function matchKeywords(text: string, weights: [string, number][]): { score: number; matched: string[] } {
  let score = 0;
  const matched: string[] = [];
  const lower = ` ${text.toLowerCase()} `;
  for (const [kw, weight] of weights) {
    if (lower.includes(kw)) {
      score += weight;
      matched.push(kw.trim());
    }
  }
  return { score, matched };
}

export function scoreJobs(jobs: Job[]): Job[] {
  return jobs
    .map((job) => {
      const titleResult = matchKeywords(job.title, TITLE_WEIGHTS);
      const descResult = matchKeywords(job.description, DESC_WEIGHTS);
      const tagsResult = matchKeywords((job.tags ?? []).join(" "), DESC_WEIGHTS);

      let locationBonus = 0;
      const loc = job.location.toLowerCase();
      if (FINLAND_LOCATIONS.some((l) => loc.includes(l))) locationBonus += 10;
      if (loc.includes("remote") || loc.includes("etä")) locationBonus += 5;

      const score = titleResult.score + descResult.score + tagsResult.score + locationBonus;
      const matchedKeywords = [...new Set([...titleResult.matched, ...descResult.matched, ...tagsResult.matched])];

      return { ...job, score, matchedKeywords };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
