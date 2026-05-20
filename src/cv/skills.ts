import { C, CAT_COLOR } from "./theme";

export function tag(label: string, color: string = C.blue): string {
  return `<span style="display:inline-block;background:${C.surface1};color:${color};border:1px groove ${C.surface2};border-radius:3px;padding:3px 6px;font-size:8px;margin:2px 2px 2px 0;font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:0.3px">${label}</span>`;
}

export function renderSkillGroups(skills: Record<string, string[]>): string {
  return Object.entries(skills)
    .map(([category, values]) => {
      if (!Array.isArray(values) || !values.length) return "";
      const color = CAT_COLOR[category] ?? C.blue;
      const title = category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return `<div style="margin-bottom:6px">
        <div style="font-size:7px;color:${color};margin-bottom:3px;font-family:'Rajdhani',sans-serif;letter-spacing:1.8px;text-transform:uppercase;border-left:2px solid ${color};padding-left:5px">▸ ${title}</div>
        <div>${values.map((s) => tag(s, color)).join("")}</div>
      </div>`;
    })
    .join("");
}
