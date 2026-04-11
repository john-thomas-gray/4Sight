import type {
  CommerceAdapter,
  PurchaseResult,
  RestoreResult,
  ThemeProduct,
} from "./types";

/**
 * Maps RevenueCat product IDs to theme IDs.
 * Update this when adding new purchasable themes.
 */
const PRODUCT_TO_THEME: Record<string, string> = {
  theme_schoolhouse: "schoolhouse",
};

/**
 * RevenueCat-backed commerce adapter for production use.
 * Requires a valid API key set via environment config.
 */
export class RevenueCatAdapter implements CommerceAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async initialize(): Promise<void> {
    try {
      const Purchases = require("react-native-purchases").default;
      Purchases.configure({ apiKey: this.apiKey });
    } catch (e) {
      console.warn("RevenueCat initialization failed:", e);
    }
  }

  async fetchProducts(): Promise<ThemeProduct[]> {
    try {
      const Purchases = require("react-native-purchases").default;
      const productIds = Object.keys(PRODUCT_TO_THEME);
      const offerings = await Purchases.getOfferings();
      const products: ThemeProduct[] = [];

      if (offerings.current?.availablePackages) {
        for (const pkg of offerings.current.availablePackages) {
          const pid = pkg.product.identifier;
          const themeId = PRODUCT_TO_THEME[pid];
          if (themeId) {
            products.push({
              themeId,
              productId: pid,
              displayPrice: pkg.product.priceString,
            });
          }
        }
      }

      return products;
    } catch (e) {
      console.warn("Failed to fetch products:", e);
      return [];
    }
  }

  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    try {
      const Purchases = require("react-native-purchases").default;
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages?.find(
        (p: any) => p.product.identifier === productId
      );
      if (!pkg) {
        return { status: "error", message: "Product not found in offerings" };
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const themeId = PRODUCT_TO_THEME[productId];
      if (themeId && customerInfo.entitlements.active[themeId]) {
        return { status: "success", themeId };
      }
      return { status: "error", message: "Entitlement not granted" };
    } catch (e: any) {
      if (e.userCancelled) {
        return { status: "cancelled" };
      }
      return { status: "error", message: e.message ?? "Purchase failed" };
    }
  }

  async restorePurchases(): Promise<RestoreResult> {
    try {
      const Purchases = require("react-native-purchases").default;
      const customerInfo = await Purchases.restorePurchases();
      const restoredThemeIds: string[] = [];

      for (const [entId] of Object.entries(
        customerInfo.entitlements.active
      )) {
        const themeId = Object.values(PRODUCT_TO_THEME).find(
          (tid) => tid === entId
        );
        if (themeId) restoredThemeIds.push(themeId);
      }

      return { status: "success", restoredThemeIds };
    } catch (e: any) {
      return { status: "error", message: e.message ?? "Restore failed" };
    }
  }

  async getOwnedThemeIds(): Promise<string[]> {
    try {
      const Purchases = require("react-native-purchases").default;
      const customerInfo = await Purchases.getCustomerInfo();
      const owned: string[] = [];

      for (const [entId] of Object.entries(
        customerInfo.entitlements.active
      )) {
        const themeId = Object.values(PRODUCT_TO_THEME).find(
          (tid) => tid === entId
        );
        if (themeId) owned.push(themeId);
      }

      return owned;
    } catch {
      return [];
    }
  }
}
