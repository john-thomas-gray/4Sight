type ThemeName = "CLASSIC" | "SCHOOLHOUSE";

const applyTheme = (themeName: ThemeName) => {
  const root = document.documentElement;
  root.className = themeName;
};
