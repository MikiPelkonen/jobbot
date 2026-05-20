# jobbot

AI-assisted CLI job application workflow. Scrapes job listings, scores them by relevance, generates tailored cover letter emails using Claude, and produces a styled PDF CV — all from a single gitignored `profile.toml`.

Built for Finnish job markets (Duunitori), but the scoring and generation are fully configurable.

---

## Features

- Scrapes Duunitori with multiple search queries, deduplicates results
- Scores and ranks jobs by relevance based on your own keyword weights
- Generates tailored cover letter emails via the local `claude` CLI (no API key needed)
- Generates a dark-themed A4 PDF CV from your profile — photo, skills sidebar, timeline, glassmorphism styling
- Saves letters to `data/apply/` and prints them copy-paste ready in the terminal
- All personal info and scoring config lives in a gitignored `profile.toml`
- Drop your CV and employment documents into `resumes/` — the app reads them automatically to enrich generated letters

---

## Requirements

- [Bun](https://bun.sh) v1.0+
- [Claude Code](https://claude.ai/code) CLI installed and authenticated (`claude` must be in PATH)
- Chromium — for PDF generation (`chromium` must be in PATH)
- `pdftotext` — for PDF resume support, install via `poppler-utils` (Linux) or `poppler` (macOS/Homebrew)

> The project uses Bun-specific APIs (`Bun.file`, `Bun.spawn`). It does not run on Node without modifications.

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

Open `profile.toml` and fill in your details. See [Profile reference](#profile-reference) below.

### Photo (optional)

Drop a photo named `photo.jpg`, `photo.png`, or `photo.webp` into the `assets/` folder. It will be rendered in the CV hero header, faded into the background. The `assets/` folder is gitignored.

### Resume documents (optional)

Drop CV files, certificates of employment, or reference letters into `resumes/`. Supported: `.txt`, `.md`, `.pdf`

```
resumes/
  my-cv.pdf
  certificate-of-employment.pdf
```

The app reads every file and passes the content to Claude when generating cover letters. The `resumes/` folder is gitignored.

---

## Usage

### Generate your CV

Generates a dark-themed A4 PDF at `data/cv.pdf`.

```bash
bun run cv
```

### Browse and score jobs

Scrapes, scores, and saves results to `data/jobs.json`.

```bash
bun run scrape
bun run scrape:details   # includes full job descriptions (slower)
```

Options:

```
--details        Fetch full job description for each listing
--no-save        Don't write to data/jobs.json
--limit=N        Cap results at N jobs
```

### Generate cover letters

Scrapes, scores, and generates a cover letter for each top job via Claude.

```bash
bun run apply
bun run apply:4          # top 4, min score 5  (TE-palvelut requirement)
bun run apply:top10      # top 10, lower score threshold
```

Options:

```
--top=N          Number of jobs to generate letters for (default: 5)
--min-score=N    Skip jobs below this score threshold (default: 10)
```

Each letter is printed to the terminal and saved to `data/apply/`.

---

## Profile reference

### Root-level arrays

These **must come before any `[table]` headers** in the file (TOML spec).

```toml
hobbies = ["Pixel art", "Music production", "Game jams"]

dev_environment = [
  "OS | EndeavourOS",
  "Editor | Neovim (LazyVim)",
  "Shell | Fish / Bash",
]
```

`dev_environment` entries use `KEY | value` format for the terminal-style row in the CV. Entries without ` | ` render as plain text.

### Skills

Skills are grouped by category. Each key maps to an accent color in the CV sidebar:

| Key | Color |
|---|---|
| `gamedev` | green |
| `web` | blue |
| `backend_devops` | peach |
| `it_support` | teal |
| `databases` | sapphire |
| `languages` | lavender |
| `tools` | grey |

```toml
[skills]
gamedev    = ["Unity", "C#", "UI Toolkit"]
web        = ["TypeScript", "React", "HTML5 Canvas"]
it_support = ["Helpdesk", "Active Directory", "Linux"]
```

### Scoring

```toml
[scoring.title]
"it support" = 30
"unity" = 25

[scoring.description]
"linux" = 8
"game" = 4

[scoring.location]
finland = ["helsinki", "espoo", "tampere", "suomi", "finland"]
location_points = 10
remote_keywords = ["remote", "etä"]
remote_points = 5
```

### Attribution footer

```toml
[attribution]
enabled = true
repo = "https://github.com/YOUR_USERNAME/jobbot"
```

Renders a small footer at the bottom of the CV. Set `enabled = false` to hide it.

---

## Project structure

```
src/
  index.ts          # Scrape/score entrypoint
  apply.ts          # Cover letter generation entrypoint
  profile.ts        # Profile loader and types
  score.ts          # Job scoring logic
  generate.ts       # Cover letter generation via claude CLI
  resumes.ts        # Resume document reader (.txt, .md, .pdf)
  scrape/
    duunitori.ts    # Duunitori scraper
    jobDetails.ts   # Job detail page scraper
  cv/
    index.ts        # CV generation entrypoint
    html.ts         # HTML/CSS template (full A4 layout)
    pdf.ts          # Photo loading, Chromium PDF export
    skills.ts       # Skill tag and group renderers
    theme.ts        # Catppuccin Mocha palette + category colors

assets/              # Photo goes here (gitignored)
resumes/             # Your CV documents (gitignored)
data/                # Scraped results, letters, cv.pdf (gitignored)
profile.toml         # Your profile (gitignored)
profile.example.toml # Template to copy
```

---

## How cover letter generation works

`apply.ts` calls `claude -p "<prompt>"` as a subprocess for each job. The prompt includes:

1. Your structured profile from `profile.toml`
2. Any documents found in `resumes/` as supplementary context
3. The job title, company, location, and description

No API key required — it uses your active Claude Code session. Letters match the language of the job posting (Finnish or English).

---

## Versioning

```bash
bun run release patch   # 1.0.0 → 1.0.1
bun run release minor   # 1.0.0 → 1.1.0
bun run release major   # 1.0.0 → 2.0.0
```

This bumps `package.json`, creates a git commit, and tags the release.
