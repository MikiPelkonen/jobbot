// Catppuccin Mocha palette
export const C = {
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

// Accent color per skill category — controls header and tag color in the sidebar
export const CAT_COLOR: Record<string, string> = {
  gamedev: C.green,
  web: C.blue,
  backend_devops: C.peach,
  it_support: C.teal,
  databases: C.sapphire,
  languages: C.lavender,
  tools: C.overlay1,
};
