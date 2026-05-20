import {
  existsSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
  unlinkSync,
} from "fs";
import path from "path";
import chalk from "chalk";
import { loadProfile, type Profile } from "./profile";

const ASSETS_DIR = "assets";
const OUT_DIR = "data";
const OUT_FILE = `${OUT_DIR}/cv.pdf`;
const TMP_HTML = `${OUT_DIR}/_cv_tmp.html`;

// Catppuccin Mocha
const C = {
  base: "#1e1e2e",
  mantle: "#181825",
  crust: "#11111b",
  surface0: "#313244",
  surface1: "#45475a",
  surface2: "#585b70",
  overlay1: "#7f849c",
  subtext0: "#a6adc8",
  subtext1: "#bac2de",
  text: "#cdd6f4",
  lavender: "#b4befe",
  blue: "#89b4fa",
  sapphire: "#74c7ec",
  sky: "#89dceb",
  teal: "#94e2d5",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  peach: "#fab387",
  mauve: "#cba6f7",
  pink: "#f5c2e7",
};

// B8: per-category accent colors for skill groups
const CAT_COLOR: Record<string, string> = {
  gamedev:       C.green,
  web:           C.blue,
  backend_devops: C.peach,
  it_support:    C.teal,
  databases:     C.sapphire,
  languages:     C.lavender,
  tools:         C.overlay1,
};

function findPhoto(): string | null {
  if (!existsSync(ASSETS_DIR)) return null;
  const file = readdirSync(ASSETS_DIR).find((f) =>
    /^photo\.(jpg|jpeg|png|webp)$/i.test(f),
  );
  return file ? path.join(ASSETS_DIR, file) : null;
}

async function photoToDataUrl(filePath: string): Promise<string> {
  const buf = await Bun.file(filePath).arrayBuffer();
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = ext === "jpg" ? "jpeg" : ext;
  return `data:image/${mime};base64,${Buffer.from(buf).toString("base64")}`;
}

function tag(label: string, color: string = C.blue): string {
  return `<span style="display:inline-block;background:${C.surface1};color:${color};border:1px solid ${C.surface2};border-radius:3px;padding:2px 7px;font-size:8.5px;margin:2px 2px 2px 0;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:0.3px">${label}</span>`;
}

function renderSkillGroups(skills: Record<string, string[]>): string {
  return Object.entries(skills)
    .map(([category, values]) => {
      if (!Array.isArray(values) || !values.length) return "";
      const color = CAT_COLOR[category] ?? C.blue;
      const title = category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return `<div style="margin-bottom:10px">
        <div style="font-size:7.5px;color:${color};margin-bottom:4px;font-family:'Rajdhani',sans-serif;letter-spacing:1.8px;text-transform:uppercase;border-left:2px solid ${color};padding-left:5px">▸ ${title}</div>
        <div>${values.map((s) => tag(s, color)).join("")}</div>
      </div>`;
    })
    .join("");
}

function buildHtml(p: Profile, photoUrl: string | null): string {
  const attr = p.attribution;
  const r = p.recent_role;
  const prevExp = p.previous_experience;

  // A6: parse "KEY | value" into terminal-style key-value rows
  const devEnvRows = (p.dev_environment ?? []).map((d) => {
    const sep = d.indexOf(" | ");
    if (sep === -1) return `<div class="devenv-row"><span class="devenv-val">${d}</span></div>`;
    return `<div class="devenv-row"><span class="devenv-key">${d.slice(0, sep)}</span><span class="devenv-val">${d.slice(sep + 3)}</span></div>`;
  }).join("");

  // B9: HUD-style footer bar
  const footerHtml = attr?.enabled
    ? `<footer class="cv-footer">
        <span class="hud-seg candidate">${p.personal.name.toUpperCase()}</span>
        <span class="hud-sep">◆</span>
        <span class="hud-seg">LOC: HELSINKI, FI</span>
        <span class="hud-sep">◆</span>
        <span class="hud-seg">STATUS: OPEN TO WORK</span>
        <span class="hud-sep">◆</span>
        <a href="${attr.repo}" class="hud-link">${attr.repo}</a>
      </footer>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
@page { margin: 0; size: A4; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 210mm; height: 297mm; }

body {
  background: ${C.base};
  color: ${C.text};
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 10px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
}

/* ── HERO HEADER ──
   A1: photo as background-image directly on <header> — no separate div, no seam */
header {
  position: relative;
  min-height: 130px;
  background-color: ${C.crust};
  background-repeat: no-repeat, no-repeat;
  background-position: 0 0, right 18px center;
  background-size: auto, auto 86%;
  overflow: hidden;
  border-bottom: 2px solid ${C.blue};
  flex-shrink: 0;
}

/* A2: bottom-right corner bracket — mirrors top-left on .header-content */
header::after {
  content: '';
  position: absolute;
  bottom: 12px; right: 14px;
  width: 14px; height: 14px;
  border-bottom: 2px solid ${C.blue};
  border-right: 2px solid ${C.blue};
  z-index: 5;
  pointer-events: none;
}

.hero-glow {
  position: absolute;
  top: -30px; left: -10px;
  width: 240px; height: 200px;
  background: radial-gradient(ellipse, ${C.blue}22 0%, transparent 70%);
  pointer-events: none;
}

.header-content {
  position: relative;
  z-index: 4;
  padding: 22px 24px 18px;
  max-width: 64%;
}

/* A2: top-left corner bracket */
.header-content::before {
  content: '';
  position: absolute;
  top: 12px; left: 14px;
  width: 14px; height: 14px;
  border-top: 2px solid ${C.blue};
  border-left: 2px solid ${C.blue};
}

/* B10: name glow */
h1 {
  font-family: 'Cinzel', serif;
  font-size: 23px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: 1.4px;
  color: ${C.text};
  text-shadow: 0 0 24px ${C.blue}66, 0 0 48px ${C.blue}33;
}
h1 em {
  color: ${C.blue};
  font-style: normal;
  text-shadow: 0 0 20px ${C.blue}88;
}

/* A3: chevron clip-path on role badge */
.role-badge {
  display: inline-flex;
  align-items: center;
  margin: 8px 0 10px;
  padding: 4px 16px 4px 10px;
  background: ${C.blue};
  color: ${C.crust};
  font-family: 'Rajdhani', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%);
}

.contacts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 8.8px;
  color: ${C.subtext0};
}
.contacts span { display: flex; align-items: center; gap: 4px; }
.contacts .ic { color: ${C.sapphire}; }

.summary-text {
  margin-top: 10px;
  max-width: 460px;
  padding-left: 10px;
  border-left: 2px solid ${C.surface2};
  color: ${C.subtext0};
  font-size: 9.2px;
  line-height: 1.55;
}

/* ── LAYOUT ── */

/* A5: content-area wraps the two-column body + bottom strip */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 37%;
  min-height: 0;
}
.main {
  padding: 16px 18px 16px 20px;
  border-right: 1px solid ${C.surface0};
  overflow: hidden;
}
.side {
  padding: 16px;
  background: ${C.mantle};
  overflow: hidden;
}

/* ── SECTION HEADERS ── */
section { margin-bottom: 14px; }

h2 {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 9px;
  padding-bottom: 4px;
  border-bottom: 1px solid ${C.surface0};
  font-family: 'Rajdhani', sans-serif;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: ${C.blue};
}
h2 .h2-diamond {
  width: 6px; height: 6px;
  background: currentColor;
  transform: rotate(45deg);
  flex-shrink: 0;
}
h2.mauve    { color: ${C.mauve};    }
h2.teal     { color: ${C.teal};     }
h2.lavender { color: ${C.lavender}; }
h2.green    { color: ${C.green};    }

/* ── EXPERIENCE CARDS ──
   A4: angular top-right cut, B7: inner glow on left edge */
.exp-card {
  background: ${C.surface0};
  border: 1px solid ${C.surface1};
  border-left: 3px solid ${C.blue};
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
  box-shadow: inset 3px 0 12px ${C.blue}33;
  padding: 10px 14px;
  margin-bottom: 10px;
}
.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}
.exp-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${C.text};
}
.exp-period {
  font-family: 'Rajdhani', sans-serif;
  font-size: 8.5px;
  font-weight: 600;
  color: ${C.mauve};
  background: ${C.surface1};
  border-left: 2px solid ${C.mauve};
  padding: 2px 8px 2px 7px;
  white-space: nowrap;
  letter-spacing: 0.5px;
}
.exp-company {
  margin-bottom: 2px;
  color: ${C.sapphire};
  font-size: 9px;
  font-weight: 600;
}
.exp-reason {
  margin-bottom: 7px;
  color: ${C.overlay1};
  font-size: 8.2px;
  font-style: italic;
}
.exp-card ul { padding-left: 14px; }
.exp-card li {
  margin-bottom: 3px;
  color: ${C.subtext1};
  font-size: 9px;
  line-height: 1.45;
}
.exp-card li::marker { color: ${C.teal}; }

.prev-entry {
  margin-bottom: 6px;
  padding: 5px 0 5px 10px;
  border-left: 2px solid ${C.surface1};
  color: ${C.subtext0};
  font-size: 8.8px;
  line-height: 1.45;
}

/* ── BOTTOM STRIP ── A5 */
.strip {
  flex-shrink: 0;
  display: flex;
  background: ${C.mantle};
  border-top: 2px solid ${C.surface0};
}
.strip-col {
  flex: 1;
  padding: 10px 13px;
  border-right: 1px solid ${C.surface0};
  overflow: hidden;
}
.strip-col:last-child { border-right: none; }

.strip-h {
  font-family: 'Rajdhani', sans-serif;
  font-size: 7.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  margin-bottom: 6px;
  padding-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 5px;
  border-bottom: 1px solid ${C.surface0};
}
.sh-d {
  display: inline-block;
  width: 4px; height: 4px;
  background: currentColor;
  transform: rotate(45deg);
  flex-shrink: 0;
}

/* A6: terminal-style dev env key-value */
.devenv-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 3px;
}
.devenv-key {
  font-family: 'Rajdhani', sans-serif;
  font-size: 7px;
  font-weight: 700;
  color: ${C.green};
  letter-spacing: 0.8px;
  text-transform: uppercase;
  min-width: 46px;
  flex-shrink: 0;
}
.devenv-val {
  font-size: 8.5px;
  color: ${C.subtext0};
  line-height: 1.3;
}

.strip-edu {
  font-size: 7.5px;
  color: ${C.subtext0};
  margin-bottom: 4px;
  padding: 3px 7px;
  border-left: 2px solid ${C.lavender};
  background: ${C.surface0};
  line-height: 1.35;
}
.strip-lang {
  font-size: 8px;
  color: ${C.subtext1};
  padding: 2px 0;
  border-bottom: 1px solid ${C.surface0};
}
.strip-lang:last-child { border-bottom: none; }
.strip-sub {
  font-family: 'Rajdhani', sans-serif;
  font-size: 7px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${C.peach};
  margin: 7px 0 4px;
}
.strip-hobby {
  font-size: 7.5px;
  color: ${C.subtext0};
  padding: 2px 0 2px 7px;
  border-left: 2px solid ${C.peach};
  margin-bottom: 3px;
  line-height: 1.3;
}

/* B9: HUD footer */
.cv-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0;
  padding: 6px 24px;
  background: ${C.crust};
  border-top: 1px solid ${C.surface0};
  font-family: 'Rajdhani', sans-serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.5px;
  flex-shrink: 0;
}
.hud-seg {
  color: ${C.subtext0};
  padding: 0 8px;
}
.hud-seg.candidate { color: ${C.blue}; }
.hud-sep { color: ${C.surface2}; font-size: 6px; }
.hud-link {
  color: ${C.blue};
  text-decoration: none;
  padding: 0 8px;
  letter-spacing: 0;
  font-weight: 500;
}
</style>
</head>
<body>

<!-- A1: photo + gradient fused into header background-image — eliminates seam -->
<header${photoUrl ? ` style="background-image: linear-gradient(to right, ${C.crust} 0%, ${C.crust} 34%, ${C.crust}dd 50%, ${C.crust}99 62%, ${C.crust}33 76%, transparent 92%), url('${photoUrl}')"` : ""}>
  <div class="hero-glow"></div>
  <div class="header-content">
    <h1>${p.personal.name.split(" ").slice(0, -1).join(" ")} <em>${p.personal.name.split(" ").slice(-1)[0]}</em></h1>
    <div class="role-badge">▸ &nbsp; Technical Generalist &nbsp;·&nbsp; IT Specialist &nbsp;·&nbsp; Game Industry</div>
    <div class="contacts">
      <span><span class="ic">✉</span>${p.personal.email}</span>
      <span><span class="ic">☏</span>${p.personal.phone}</span>
      <span><span class="ic">◈</span>${p.personal.location}</span>
      ${p.personal.github ? `<span><span class="ic">⌘</span>${p.personal.github}</span>` : ""}
      ${p.personal.website ? `<span><span class="ic">⌂</span>${p.personal.website}</span>` : ""}
    </div>
    ${p.personal.summary ? `<div class="summary-text">${p.personal.summary}</div>` : ""}
  </div>
</header>

<!-- A5: content-area → two-column body + bottom strip -->
<div class="content-area">
<div class="body">

  <div class="main">
    <section>
      <h2><span class="h2-diamond"></span>Experience</h2>
      <div class="exp-card">
        <div class="exp-header">
          <span class="exp-title">${r.title}</span>
          <span class="exp-period">${r.period}</span>
        </div>
        <div class="exp-company">${r.company}</div>
        <div class="exp-reason">${r.end_reason}</div>
        <ul>${r.duties.map((d) => `<li>${d}</li>`).join("")}</ul>
      </div>
      ${prevExp.map((e) => `<div class="prev-entry"><span style="color:${C.teal};font-weight:700;font-family:'Rajdhani',sans-serif;letter-spacing:1px">▸</span> ${e.entry}</div>`).join("")}
    </section>
  </div>

  <!-- B8: skills sidebar — categories color-coded by domain -->
  <div class="side">
    <section>
      <h2 class="teal"><span class="h2-diamond"></span>Skills</h2>
      ${renderSkillGroups(p.skills)}
    </section>
  </div>

</div>

<!-- A5: bottom strip — dev env | education | languages + hobbies -->
<div class="strip">

  ${p.dev_environment?.length ? `<div class="strip-col">
    <div class="strip-h" style="color:${C.green}"><span class="sh-d"></span>&gt;_ Dev Environment</div>
    ${devEnvRows}
  </div>` : ""}

  <div class="strip-col" style="flex:1.2">
    <div class="strip-h" style="color:${C.lavender}"><span class="sh-d"></span>Education</div>
    ${p.education.map((e) => `<div class="strip-edu">${e.entry}</div>`).join("")}
  </div>

  <div class="strip-col">
    <div class="strip-h" style="color:${C.mauve}"><span class="sh-d"></span>Languages</div>
    ${p.languages.list.map((l) => `<div class="strip-lang">${l}</div>`).join("")}
    ${p.hobbies?.length ? `<div class="strip-sub">Interests</div>${p.hobbies.map((h) => `<div class="strip-hobby">${h}</div>`).join("")}` : ""}
  </div>

</div>
</div>

${footerHtml}
</body>
</html>`;
}

async function htmlToPdf(htmlPath: string, outPath: string): Promise<void> {
  const absHtml = path.resolve(htmlPath);
  const absOut = path.resolve(outPath);
  const proc = Bun.spawn(
    [
      "chromium",
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      `--print-to-pdf=${absOut}`,
      "--print-to-pdf-no-header",
      "--no-pdf-header-footer",
      `file://${absHtml}`,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0)
    throw new Error(`chromium exited ${exitCode}: ${err.trim()}`);
}

const profile = await loadProfile();
const photoPath = findPhoto();
const photoUrl = photoPath ? await photoToDataUrl(photoPath) : null;
if (photoPath) console.log(chalk.dim(`Photo: ${photoPath}`));

const html = buildHtml(profile, photoUrl);
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(TMP_HTML, html);

process.stdout.write(chalk.dim("Generating CV PDF..."));
try {
  await htmlToPdf(TMP_HTML, OUT_FILE);
  console.log(chalk.green(" done"));
  console.log(chalk.bold(`Saved -> ${OUT_FILE}`));
} finally {
  if (existsSync(TMP_HTML)) unlinkSync(TMP_HTML);
}
