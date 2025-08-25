import { COLOR_THEMES, ColorThemeType } from "@/constants/colorThemes";

export const getThemeByName = (name: string): ColorThemeType => {
  const theme = COLOR_THEMES[name as keyof typeof COLOR_THEMES];
  if (!theme) {
    throw new Error(`Theme "${name}" not found in COLOR_THEMES`);
  }
  return theme;
};

export const getNameByTheme = (theme: ColorThemeType): string | undefined => {
  const entry = Object.entries(COLOR_THEMES).find(
    ([, value]) => value === theme
  );
  return entry ? entry[0] : undefined;
};
