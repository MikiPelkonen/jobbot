import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import chalk from "chalk";
import { loadProfile } from "../profile";
import { findPhoto, photoToDataUrl, htmlToPdf } from "./pdf";
import { buildHtml } from "./html";

const OUT_DIR = "data";
const OUT_FILE = `${OUT_DIR}/cv.pdf`;
const TMP_HTML = `${OUT_DIR}/_cv_tmp.html`;

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
