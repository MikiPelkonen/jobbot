import { readdirSync, existsSync } from "fs";
import path from "path";

const RESUMES_DIR = "resumes";
const SUPPORTED = new Set([".txt", ".md", ".pdf"]);

async function readPdf(filePath: string): Promise<string> {
  const proc = Bun.spawn(["pdftotext", filePath, "-"], { stdout: "pipe", stderr: "pipe" });
  const [text, err] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  if (exitCode !== 0) throw new Error(`pdftotext failed: ${err.trim()}`);
  return text.trim();
}

export async function loadResumes(): Promise<string> {
  if (!existsSync(RESUMES_DIR)) return "";

  const files = readdirSync(RESUMES_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED.has(ext) && f !== "example.md";
  });

  if (!files.length) return "";

  const parts: string[] = [];

  for (const file of files) {
    const filePath = path.join(RESUMES_DIR, file);
    try {
      const ext = path.extname(file).toLowerCase();
      const text = ext === ".pdf"
        ? await readPdf(filePath)
        : await Bun.file(filePath).text();

      if (text.trim()) {
        parts.push(`--- ${file} ---\n${text.trim()}`);
      }
    } catch (e) {
      console.warn(`Warning: could not read ${file}: ${(e as Error).message}`);
    }
  }

  return parts.join("\n\n");
}
