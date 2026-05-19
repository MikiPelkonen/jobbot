# jobbot

AI-assisted CLI job application workflow. Scrapes job listings, scores them by relevance, and generates tailored cover letter emails using Claude — ready to copy-paste into application forms.

Built for Finnish job markets (Duunitori), but the scoring and generation are fully configurable via a TOML profile.

---

## Features

- Scrapes Duunitori with multiple search queries, deduplicates results
- Scores and ranks jobs by relevance based on your own keyword weights
- Generates tailored cover letter emails via the local `claude` CLI (no API key needed)
- Saves letters to `data/apply/` and prints them copy-paste ready in the terminal
- All personal info and scoring config lives in a gitignored `profile.toml`

---

## Requirements

- [Bun](https://bun.sh) v1.0+
- [Claude Code](https://claude.ai/code) CLI installed and authenticated (`claude` must be in PATH)

> **Node.js:** The project uses Bun-specific APIs (`Bun.file`, `Bun.spawn`). It does not run on Node without modifications.

---

## Setup

```bash
# 1. Clone and install dependencies
git clone https://github.com/MikiPelkonen/jobbot.git
cd jobbot
bun install

# 2. Set up your profile
cp profile.example.toml profile.toml
```

Then open `profile.toml` and fill in your details. It has four sections:

| Section                              | What it controls                                           |
| ------------------------------------ | ---------------------------------------------------------- |
| `[personal]`                         | Your name, email, phone, location                          |
| `[education]`, `[recent_role]`, etc. | Your CV — used to generate cover letters                   |
| `[emphasis]`                         | What the letter leads with and which skills to highlight   |
| `[scoring]`                          | Keyword weights that rank job listings by relevance to you |

`profile.toml` is gitignored — your personal info never gets committed.

---

## Usage

### Browse and score jobs

Scrapes, scores, and saves results to `data/jobs.json`.

```bash
bun run src/index.ts "it support,unity developer,qa"
```

Options:

```
--details        Fetch full job description for each listing (slower)
--no-save        Don't write to data/jobs.json
--limit=N        Cap results at N jobs
```

### Generate cover letters

Scrapes, scores, takes the top N jobs, and generates a cover letter for each using Claude.

```bash
bun run src/apply.ts "it support,unity developer,qa"
```

Options:

```
--top=N          Number of jobs to generate letters for (default: 5)
--min-score=N    Skip jobs below this score threshold (default: 10)
```

Each letter is printed to the terminal with a clear separator and saved to `data/apply/`.

---

## Tuning the scorer

Open `profile.toml` and edit `[scoring.title]` and `[scoring.description]`. Each entry is a keyword and a weight — higher weight means more relevant to you.

```toml
[scoring.title]
"it support" = 30
"unity" = 30
"helpdesk" = 25
"developer" = 5

[scoring.description]
"linux" = 8
"typescript" = 8
"game" = 4
```

Title matches are weighted higher than description matches. Location bonuses are configured under `[scoring.location]`.

---

## Project structure

```
src/
  index.ts        # Browse/score entrypoint
  apply.ts        # Generate cover letters entrypoint
  score.ts        # Job scoring logic
  generate.ts     # Cover letter generation via claude CLI
  profile.ts      # Shared profile loader
  scrape/
    duunitori.ts  # Duunitori scraper
    jobDetails.ts # Job detail page scraper
  types.ts        # Shared types

profile.toml          # Your profile (gitignored)
profile.example.toml  # Template to copy
data/                 # Scraped results and generated letters (gitignored)
```

---

## How cover letter generation works

`apply.ts` calls `claude -p "<prompt>"` as a subprocess for each job. The prompt includes your full profile from `profile.toml` and the job details. No API key is required — it uses your active Claude Code session.

Letters match the language of the job posting (Finnish or English).
