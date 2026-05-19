import * as cheerio from "cheerio";
import type { Job } from "../types";

const BASE_URL = "https://duunitori.fi";

export async function scrapeDuunitori(query: string): Promise<Job[]> {
  const url = `${BASE_URL}/tyopaikat?haku=${encodeURIComponent(query)}`;

  const res = await fetch(url);

  const html = await res.text();
  const $ = cheerio.load(html);
  const jobs: Job[] = [];

  $(".job-box").each((_, el) => {
    const title = $(el).find(".job-box__title").text().trim();
    const anchor = $(el).find("a.job-box__hover");
    const company = anchor.attr("data-company") ?? "";
    const href = anchor.attr("href") ?? "";
    const location = $(el).find(".job-box__job-location span").text().trim();
    const postedAt = $(el).find(".job-box__job-posted").text().trim();

    if (title) {
      jobs.push({
        title,
        company,
        url: BASE_URL + href,
        location,
        description: "",
        source: "duunitori",
        postedAt,
      });
    }
  });

  return jobs;
}
