import * as cheerio from "cheerio";
import type { Job } from "../types";

const BASE_URL = "https://duunitori.fi";
const FIND_JOB_URL_SEGMENT = "/tyopaikat?haku=";
const BASE_SOURCE = "duunitori";

const HEADERS = {
  userAgent: { "User-Agent": "Mozilla/5.0" },
} as const;

const SELECTORS = {
  jobBox: ".job-box",
  anchor: "a.job-box__hover",
  title: ".job-box__title",
  location: ".job-box__job-location span",
  posted: ".job-box__job-posted",
  salary: ".tag--salary",
  badge: ".tag--info, .tag--success",
  easyApply: ".tag--easy-apply",
  logo: ".job-box__logo",
} as const;

const DATA_ATTRS = {
  company: "data-company",
  href: "href",
  category: "data-category",
  src: "src",
} as const;

export async function scrapeDuunitori(query: string): Promise<Job[]> {
  const url = `${BASE_URL}${FIND_JOB_URL_SEGMENT}${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: HEADERS.userAgent,
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  const jobs: Job[] = [];

  $(SELECTORS.jobBox).each((_, el) => {
    const anchor = $(el).find(SELECTORS.anchor);
    const href = anchor.attr(DATA_ATTRS.href) ?? "";
    const title = $(el).find(SELECTORS.title).text().trim();

    if (!title) return;

    jobs.push({
      title,
      company: anchor.attr(DATA_ATTRS.company) ?? "",
      category: anchor.attr(DATA_ATTRS.category) ?? undefined,
      url: BASE_URL + href,
      jobId: href,
      location: $(el).find(SELECTORS.location).text().trim().replace(/\s*-$/, ""),
      postedAt: $(el).find(SELECTORS.posted).text().trim(),
      salary: $(el).find(SELECTORS.salary).text().trim() || undefined,
      badge: $(el).find(SELECTORS.badge).first().text().trim() || undefined,
      easyApply: $(el).find(SELECTORS.easyApply).length > 0,
      logoUrl: $(el).find(SELECTORS.logo).attr(DATA_ATTRS.src) ?? undefined,
      description: "",
      source: BASE_SOURCE,
    });
  });

  return jobs;
}
