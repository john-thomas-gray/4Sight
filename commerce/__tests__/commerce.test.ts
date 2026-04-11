import { MockCommerceAdapter } from "../mockAdapter";

describe("MockCommerceAdapter", () => {
  let adapter: MockCommerceAdapter;

  beforeEach(() => {
    adapter = new MockCommerceAdapter();
  });

  it("initializes without error", async () => {
    await expect(adapter.initialize()).resolves.toBeUndefined();
  });

  it("returns a product catalog", async () => {
    const products = await adapter.fetchProducts();
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty("themeId");
    expect(products[0]).toHaveProperty("productId");
    expect(products[0]).toHaveProperty("displayPrice");
  });

  it("starts with no owned themes", async () => {
    const owned = await adapter.getOwnedThemeIds();
    expect(owned).toHaveLength(0);
  });

  it("purchases a product and marks it as owned", async () => {
    const products = await adapter.fetchProducts();
    const result = await adapter.purchaseProduct(products[0].productId);
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.themeId).toBe(products[0].themeId);
    }

    const owned = await adapter.getOwnedThemeIds();
    expect(owned).toContain(products[0].themeId);
  });

  it("returns error for unknown product", async () => {
    const result = await adapter.purchaseProduct("nonexistent");
    expect(result.status).toBe("error");
  });

  it("restores previously purchased themes", async () => {
    const products = await adapter.fetchProducts();
    await adapter.purchaseProduct(products[0].productId);

    const result = await adapter.restorePurchases();
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.restoredThemeIds).toContain(products[0].themeId);
    }
  });

  it("restore returns empty when nothing was purchased", async () => {
    const result = await adapter.restorePurchases();
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.restoredThemeIds).toHaveLength(0);
    }
  });
});

describe("ThemeAvailability logic", () => {
  it("free themes are always available", () => {
    const { THEME_REGISTRY } = require("@/constants/themes/registry");
    const classicEntry = THEME_REGISTRY.find(
      (t: any) => t.id === "classic"
    );
    expect(classicEntry.defaultAvailability).toBe("free");
    expect(classicEntry.productId).toBeNull();
  });

  it("locked themes have a product ID", () => {
    const { THEME_REGISTRY } = require("@/constants/themes/registry");
    const lockedEntries = THEME_REGISTRY.filter(
      (t: any) => t.defaultAvailability === "locked"
    );
    for (const entry of lockedEntries) {
      expect(entry.productId).toBeTruthy();
    }
  });

  it("all registry entries have required fields", () => {
    const { THEME_REGISTRY } = require("@/constants/themes/registry");
    for (const entry of THEME_REGISTRY) {
      expect(entry.id).toBeTruthy();
      expect(entry.label).toBeTruthy();
      expect(entry.theme).toBeTruthy();
      expect(entry.theme.colorTheme).toBeTruthy();
      expect(entry.theme.textAndFontTheme).toBeTruthy();
      expect(["free", "locked"]).toContain(entry.defaultAvailability);
    }
  });
});
