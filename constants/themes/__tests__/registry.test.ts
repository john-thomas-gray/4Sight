import { getThemeById, THEME_REGISTRY } from "../registry";
import { CLASSIC } from "../classic";
import { SCHOOLHOUSE } from "../schoolhouse";
import { SEASIDE } from "../seaside";

describe("theme registry", () => {
  it("registers every selectable theme with availability metadata", () => {
    expect(THEME_REGISTRY.map((entry) => entry.id)).toEqual([
      "classic",
      "schoolhouse",
      "seaside",
    ]);
    expect(THEME_REGISTRY.map((entry) => entry.label)).toEqual([
      "Classic",
      "Schoolhouse",
      "Seaside",
    ]);
    expect(THEME_REGISTRY.map((entry) => entry.defaultAvailability)).toEqual([
      "free",
      "locked",
      "free",
    ]);
    expect(THEME_REGISTRY.find((entry) => entry.id === "schoolhouse")?.productId)
      .toBe("theme_schoolhouse");
  });

  it("resolves registered themes and falls back to classic", () => {
    expect(getThemeById("classic")).toBe(CLASSIC);
    expect(getThemeById("schoolhouse")).toBe(SCHOOLHOUSE);
    expect(getThemeById("seaside")).toBe(SEASIDE);
    expect(getThemeById("missing-theme")).toBe(CLASSIC);
  });
});
