import type { Theme, ThemeId } from "./types";

export const COLORS = {
  ink: "#141311",
  paper: "#f6ead9",
  page: "#f1e4cf",
  surface: "#e9dbc3",
  muted: "#5b5146",
  vinyl: "#e85c0d",
  vinylDeep: "#b8450a",
  sunburst: "#f6b436",
  olive: "#4b5b3b",
  dark: "#111111",
};

export const THEMES: readonly Theme[] = [
  { id: "paper", name: "Papier", background: COLORS.page, text: COLORS.ink, accent: COLORS.vinyl },
  { id: "night", name: "Nacht", background: COLORS.dark, text: COLORS.paper, accent: COLORS.vinyl },
  { id: "orange", name: "Orange", background: COLORS.vinyl, text: COLORS.ink, accent: COLORS.paper },
  { id: "olive", name: "Olive", background: COLORS.olive, text: COLORS.paper, accent: COLORS.sunburst },
];

export const getTheme = (id: ThemeId): Theme => THEMES.find((theme) => theme.id === id)!;

export function accentText(theme: Theme): string {
  return theme.id === "paper" ? COLORS.vinylDeep : theme.accent;
}