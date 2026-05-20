import { loadProfile, type Profile } from "./profile";
import { loadResumes } from "./resumes";
import type { Job } from "./types";

function buildProfileText(p: Profile): string {
  return `
Name: ${p.personal.name}
Email: ${p.personal.email}
Phone: ${p.personal.phone}
Location: ${p.personal.location}

LANGUAGES: ${p.languages.list.join(", ")}

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
${Object.entries(p.skills)
  .map(([cat, vals]) => `- ${cat.replace(/_/g, " ")}: ${vals.join(", ")}`)
  .join("\n")}

LOOKING FOR:
${p.target.roles.map((r) => `- ${r}`).join("\n")}
- Location: ${p.target.location_preference}
`.trim();
}

function buildPrompt(job: Job, p: Profile, profileText: string, resumeText: string): string {
  const leadWith =
    p.emphasis?.lead_with ??
    `${p.recent_role.title} at ${p.recent_role.company} (${p.recent_role.period})`;
  const highlightSkills =
    p.emphasis?.highlight_skills ?? Object.values(p.skills).flat().slice(0, 5);

  return `
You are helping write a short, professional cover letter email for a job application.

MY BACKGROUND:
${profileText}
${resumeText ? `\nSUPPLEMENTARY DOCUMENTS (use for additional detail and specifics):\n${resumeText}\n` : ""}
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
const resumeText = await loadResumes();

export async function generateCoverLetter(job: Job): Promise<string> {
  const prompt = buildPrompt(job, profile, profileText, resumeText);
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
