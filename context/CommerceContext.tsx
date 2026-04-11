import type {
  CommerceAdapter,
  PurchaseResult,
  RestoreResult,
  ThemeAvailability,
  ThemeProduct,
} from "@/commerce";
import { MockCommerceAdapter } from "@/commerce";
import { THEME_REGISTRY } from "@/constants/themes/registry";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CommerceContextType = {
  isLoaded: boolean;
  products: ThemeProduct[];
  getThemeAvailability: (themeId: string) => ThemeAvailability;
  purchaseTheme: (themeId: string) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<RestoreResult>;
  getProductForTheme: (themeId: string) => ThemeProduct | undefined;
};

const CommerceContext = createContext<CommerceContextType | undefined>(
  undefined
);

type CommerceProviderProps = {
  children: ReactNode;
  adapter?: CommerceAdapter;
};

export const CommerceProvider: React.FC<CommerceProviderProps> = ({
  children,
  adapter,
}) => {
  const adapterRef = React.useRef<CommerceAdapter>(
    adapter ?? new MockCommerceAdapter()
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [products, setProducts] = useState<ThemeProduct[]>([]);
  const [ownedThemeIds, setOwnedThemeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        await adapterRef.current.initialize();
        const [prods, owned] = await Promise.all([
          adapterRef.current.fetchProducts(),
          adapterRef.current.getOwnedThemeIds(),
        ]);
        setProducts(prods);
        setOwnedThemeIds(new Set(owned));
      } catch {
        // Graceful offline: start with defaults
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const getThemeAvailability = useCallback(
    (themeId: string): ThemeAvailability => {
      const entry = THEME_REGISTRY.find((t) => t.id === themeId);
      if (!entry) return "locked";
      if (entry.defaultAvailability === "free") return "free";
      if (ownedThemeIds.has(themeId)) return "owned";
      return "locked";
    },
    [ownedThemeIds]
  );

  const getProductForTheme = useCallback(
    (themeId: string): ThemeProduct | undefined => {
      return products.find((p) => p.themeId === themeId);
    },
    [products]
  );

  const purchaseTheme = useCallback(
    async (themeId: string): Promise<PurchaseResult> => {
      const product = products.find((p) => p.themeId === themeId);
      if (!product) {
        return { status: "error", message: "Product not found" };
      }
      const result = await adapterRef.current.purchaseProduct(
        product.productId
      );
      if (result.status === "success") {
        setOwnedThemeIds((prev) => new Set([...prev, result.themeId]));
      }
      return result;
    },
    [products]
  );

  const restorePurchases = useCallback(async (): Promise<RestoreResult> => {
    const result = await adapterRef.current.restorePurchases();
    if (result.status === "success") {
      setOwnedThemeIds(
        (prev) => new Set([...prev, ...result.restoredThemeIds])
      );
    }
    return result;
  }, []);

  const value = useMemo<CommerceContextType>(
    () => ({
      isLoaded,
      products,
      getThemeAvailability,
      purchaseTheme,
      restorePurchases,
      getProductForTheme,
    }),
    [
      isLoaded,
      products,
      getThemeAvailability,
      purchaseTheme,
      restorePurchases,
      getProductForTheme,
    ]
  );

  return (
    <CommerceContext.Provider value={value}>
      {children}
    </CommerceContext.Provider>
  );
};

export const useCommerce = () => {
  const ctx = useContext(CommerceContext);
  if (!ctx)
    throw new Error("useCommerce must be used within CommerceProvider");
  return ctx;
};
