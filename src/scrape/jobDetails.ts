import * as cheerio from "cheerio";
import type { Job } from "../types";

const HEADERS = {
  userAgent: { "User-Agent": "Mozilla/5.0" },
} as const;

const SELECTORS = {
  applyUrl: "a.js-jobentry-apply",
  phoneHref: "a[href='tel:']",
  description: ".description--jobentry",
  mailTo: "a[href^='mailto:']",
  deadlineMeta: "meta[property='article:expiration_time']",
} as const;

const DATA_ATTRS = {
  href: "href",
  content: "content",
} as const;

const REPLACES = {
  tel: "tel:",
  mailTo: "mailto:",
} as const;

const MATCHER = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;

export async function scrapeJobDetails(job: Job): Promise<Job> {
  const res = await fetch(job.url, {
    headers: HEADERS.userAgent,
  });

  const html = await res.text();
  const $ = cheerio.load(html);

  const applyUrl = $(SELECTORS.applyUrl).attr(DATA_ATTRS.href) ?? undefined;
  const phoneHref = $(SELECTORS.phoneHref).attr(DATA_ATTRS.href) ?? "";
  const contactPhone = phoneHref
    ? phoneHref.replace(REPLACES.tel, "")
    : undefined;
  const description = $(SELECTORS.description).text().trim();
  const mailtoHref = $(SELECTORS.mailTo).attr(DATA_ATTRS.href);
  let contactEmail: string | undefined;
  if (mailtoHref) {
    contactEmail = mailtoHref.replace(REPLACES.mailTo, "");
  } else {
    const match = description.match(MATCHER);
    contactEmail = match?.[0] ?? undefined;
  }

  const deadlineMeta = $(SELECTORS.deadlineMeta).attr(DATA_ATTRS.content);
  const deadline = deadlineMeta ? deadlineMeta.split("T")[0] : undefined;

  return {
    ...job,
    description,
    applyUrl,
    contactPhone,
    contactEmail,
    deadline,
  };
}
