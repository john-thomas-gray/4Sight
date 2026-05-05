export type ThemeAvailability = "free" | "owned" | "locked";

export type ThemeProduct = {
  themeId: string;
  productId: string;
  displayPrice: string;
};

export type PurchaseResult =
  | { status: "success"; themeId: string }
  | { status: "cancelled" }
  | { status: "error"; message: string };

export type RestoreResult =
  | { status: "success"; restoredThemeIds: string[] }
  | { status: "error"; message: string };

/**
 * Abstract commerce adapter interface.
 * Implementations: RevenueCatAdapter (production), MockAdapter (dev/test).
 */
export interface CommerceAdapter {
  initialize(): Promise<void>;
  fetchProducts(): Promise<ThemeProduct[]>;
  purchaseProduct(productId: string): Promise<PurchaseResult>;
  restorePurchases(): Promise<RestoreResult>;
  getOwnedThemeIds(): Promise<string[]>;
}
