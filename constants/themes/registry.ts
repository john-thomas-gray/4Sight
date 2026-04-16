import type { ThemeAvailability } from "@/commerce";
import { ThemeType } from "@/types/themes/theme";
import { CLASSIC } from "./classic";
import { SCHOOLHOUSE } from "./schoolhouse";
import { SEASIDE } from "./seaside";

export type ThemeEntry = {
  id: string;
  label: string;
  theme: ThemeType;
  defaultAvailability: ThemeAvailability;
  productId: string | null;
};

export const THEME_REGISTRY: ThemeEntry[] = [
  {
    id: "classic",
    label: "Classic",
    theme: CLASSIC,
    defaultAvailability: "free",
    productId: null,
  },
  {
    id: "schoolhouse",
    label: "Schoolhouse",
    theme: SCHOOLHOUSE,
    defaultAvailability: "locked",
    productId: "theme_schoolhouse",
  },
  {
    id: "seaside",
    label: "Seaside",
    theme: SEASIDE,
    defaultAvailability: "free",
    productId: null,
  },
];

export function getThemeById(id: string): ThemeType {
  const entry = THEME_REGISTRY.find((t) => t.id === id);
  return entry ? entry.theme : CLASSIC;
}
