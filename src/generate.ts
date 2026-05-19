import { parse } from "smol-toml";
import type { Job } from "./types";

interface Profile {
  personal: { name: string; email: string; phone: string; location: string };
  languages: { list: string };
  education: { entry: string }[];
  recent_role: { title: string; company: string; period: string; end_reason: string; duties: string[] };
  previous_experience: { entry: string }[];
  skills: { current: string[]; some_experience: string[] };
  target: { roles: string[]; location_preference: string };
  emphasis?: { lead_with?: string; highlight_skills?: string[] };
}

async function loadProfile(): Promise<Profile> {
  const file = Bun.file("profile.toml");
  if (!file.size) {
    console.error("profile.toml not found. Copy profile.example.toml to profile.toml and fill in your details.");
    process.exit(1);
  }
  return parse(await file.text()) as unknown as Profile;
}

function buildProfileText(p: Profile): string {
  return `
Name: ${p.personal.name}
Email: ${p.personal.email}
Phone: ${p.personal.phone}
Location: ${p.personal.location}

LANGUAGES: ${p.languages.list}

EDUCATION:
${p.education.map((e) => `- ${e.entry}`).join("\n")}

MOST RECENT ROLE (emphasise this heavily):
${p.recent_role.title}, ${p.recent_role.company}, ${p.recent_role.period}
End reason: ${p.recent_role.end_reason}
Duties:
${p.recent_role.duties.map((d) => `- ${d}`).join("\n")}

PREVIOUS EXPERIENCE (mention only if genuinely relevant):
${p.previous_experience.map((e) => `- ${e.entry}`).join("\n")}

SKILLS:
- Strong/current: ${p.skills.current.join(", ")}
- Some experience: ${p.skills.some_experience.join(", ")}

LOOKING FOR:
${p.target.roles.map((r) => `- ${r}`).join("\n")}
- Location: ${p.target.location_preference}
`.trim();
}

function buildPrompt(job: Job, p: Profile, profileText: string): string {
  const leadWith = p.emphasis?.lead_with
    ?? `${p.recent_role.title} at ${p.recent_role.company} (${p.recent_role.period})`;
  const highlightSkills = p.emphasis?.highlight_skills ?? p.skills.current.slice(0, 5);

  return `
You are helping write a short, professional cover letter email for a job application.

MY BACKGROUND:
${profileText}

JOB:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
${job.description ? `Description:\n${job.description}\n` : ""}
${job.contactName ? `Contact: ${job.contactName}` : ""}

INSTRUCTIONS:
- Write a cover letter email body (no subject line, no "Dear Sir/Madam" opener unless natural)
- 150-250 words, professional but not stiff
- Lead with: ${leadWith}
- Pick the 2-3 most relevant duties/responsibilities from that role for THIS specific job and be specific
- Highlight these skills if relevant to the role: ${highlightSkills.join(", ")}
- Only mention older experience if it genuinely adds something for this specific job
- Match the language of the job posting (Finnish if Finnish, English if English)
- End with a brief call to action
- Output ONLY the email body text, nothing else — no explanations, no markdown
`.trim();
}

const profile = await loadProfile();
const profileText = buildProfileText(profile);

export async function generateCoverLetter(job: Job): Promise<string> {
  const prompt = buildPrompt(job, profile, profileText);
  const proc = Bun.spawn(["claude", "-p", prompt], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [text, err] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;
  if (exitCode !== 0) throw new Error(`claude exited ${exitCode}: ${err.trim()}`);

  return text.trim();
}
