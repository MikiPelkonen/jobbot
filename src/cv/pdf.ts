import { existsSync, readdirSync } from "fs";
import path from "path";

const ASSETS_DIR = "assets";

export function findPhoto(): string | null {
  if (!existsSync(ASSETS_DIR)) return null;
  const file = readdirSync(ASSETS_DIR).find((f) => /^photo\.(jpg|jpeg|png|webp)$/i.test(f));
  return file ? path.join(ASSETS_DIR, file) : null;
}

export async function photoToDataUrl(filePath: string): Promise<string> {
  const buf = await Bun.file(filePath).arrayBuffer();
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = ext === "jpg" ? "jpeg" : ext;
  return `data:image/${mime};base64,${Buffer.from(buf).toString("base64")}`;
}

export async function htmlToPdf(htmlPath: string, outPath: string): Promise<void> {
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
  if (exitCode !== 0) throw new Error(`chromium exited ${exitCode}: ${err.trim()}`);
}
