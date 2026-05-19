import { loadProfile } from "./profile";
import type { Job } from "./types";

function matchKeywords(
  text: string,
  weights: Record<string, number>,
): { score: number; matched: string[] } {
  let score = 0;
  const matched: string[] = [];
  const lower = ` ${text.toLowerCase()} `;
  for (const [kw, weight] of Object.entries(weights)) {
    if (lower.includes(kw)) {
      score += weight;
      matched.push(kw.trim());
    }
  }
  return { score, matched };
}

export async function scoreJobs(jobs: Job[]): Promise<Job[]> {
  const profile = await loadProfile();
  const { title, description, location: loc } = profile.scoring;

  return jobs
    .map((job) => {
      const titleResult = matchKeywords(job.title, title);
      const descResult = matchKeywords(job.description, description);
      const tagsResult = matchKeywords((job.tags ?? []).join(" "), description);

      let locationBonus = 0;
      const jobLoc = job.location.toLowerCase();
      if (loc.finland.some((l) => jobLoc.includes(l)))
        locationBonus += loc.location_points;
      if (loc.remote_keywords.some((r) => jobLoc.includes(r)))
        locationBonus += loc.remote_points;

      const score =
        titleResult.score + descResult.score + tagsResult.score + locationBonus;
      const matchedKeywords = [
        ...new Set([
          ...titleResult.matched,
          ...descResult.matched,
          ...tagsResult.matched,
        ]),
      ];

      return { ...job, score, matchedKeywords };
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
