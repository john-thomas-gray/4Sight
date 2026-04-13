import type {
  CommerceAdapter,
  PurchaseResult,
  RestoreResult,
  ThemeProduct,
} from "./types";

/**
 * Mock commerce adapter for development and testing.
 * Simulates purchases in-memory without requiring a real store backend.
 */
export class MockCommerceAdapter implements CommerceAdapter {
  private ownedIds: Set<string> = new Set();
  private catalog: ThemeProduct[] = [
    { themeId: "schoolhouse", productId: "theme_schoolhouse", displayPrice: "$0.99" },
  ];

  async initialize(): Promise<void> {
    // No-op for mock
  }

  async fetchProducts(): Promise<ThemeProduct[]> {
    return [...this.catalog];
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    const product = this.catalog.find((p) => p.productId === productId);
    if (!product) {
      return { status: "error", message: `Unknown product: ${productId}` };
    }
    this.ownedIds.add(product.themeId);
    return { status: "success", themeId: product.themeId };
  }

  async restorePurchases(): Promise<RestoreResult> {
    return { status: "success", restoredThemeIds: [...this.ownedIds] };
  }

  async getOwnedThemeIds(): Promise<string[]> {
    return [...this.ownedIds];
  }
}
