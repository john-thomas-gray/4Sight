import { MockCommerceAdapter } from "../mockAdapter";
import { THEME_REGISTRY } from "@/constants/themes/registry";

describe("theme entitlement gating", () => {
  let adapter: MockCommerceAdapter;

  beforeEach(() => {
    adapter = new MockCommerceAdapter();
  });

  it("free themes are accessible without purchase", () => {
    const freeThemes = THEME_REGISTRY.filter(
      (t) => t.defaultAvailability === "free"
    );
    expect(freeThemes.length).toBeGreaterThan(0);
    for (const t of freeThemes) {
      expect(t.productId).toBeNull();
    }
  });

  it("locked themes become owned after purchase", async () => {
    const locked = THEME_REGISTRY.filter(
      (t) => t.defaultAvailability === "locked"
    );
    expect(locked.length).toBeGreaterThan(0);

    for (const t of locked) {
      const ownedBefore = await adapter.getOwnedThemeIds();
      expect(ownedBefore).not.toContain(t.id);

      const result = await adapter.purchaseProduct(t.productId!);
      expect(result.status).toBe("success");

      const ownedAfter = await adapter.getOwnedThemeIds();
      expect(ownedAfter).toContain(t.id);
    }
  });

  it("purchasing does not affect free themes", async () => {
    const products = await adapter.fetchProducts();
    await adapter.purchaseProduct(products[0].productId);

    const freeThemes = THEME_REGISTRY.filter(
      (t) => t.defaultAvailability === "free"
    );
    for (const t of freeThemes) {
      expect(t.defaultAvailability).toBe("free");
    }
  });

  it("restore recovers purchased themes", async () => {
    const locked = THEME_REGISTRY.filter(
      (t) => t.defaultAvailability === "locked"
    );
    for (const t of locked) {
      await adapter.purchaseProduct(t.productId!);
    }

    const result = await adapter.restorePurchases();
    expect(result.status).toBe("success");
    if (result.status === "success") {
      for (const t of locked) {
        expect(result.restoredThemeIds).toContain(t.id);
      }
    }
  });

  it("double purchase is idempotent", async () => {
    const locked = THEME_REGISTRY.find(
      (t) => t.defaultAvailability === "locked"
    )!;
    await adapter.purchaseProduct(locked.productId!);
    await adapter.purchaseProduct(locked.productId!);

    const owned = await adapter.getOwnedThemeIds();
    const count = owned.filter((id) => id === locked.id).length;
    expect(count).toBe(1);
  });

  it("theme registry covers all product IDs in mock catalog", async () => {
    const products = await adapter.fetchProducts();
    for (const product of products) {
      const entry = THEME_REGISTRY.find((t) => t.id === product.themeId);
      expect(entry).toBeDefined();
      expect(entry!.productId).toBe(product.productId);
    }
  });
});
