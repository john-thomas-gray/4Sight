import type {
  CommerceAdapter,
  PurchaseResult,
  RestoreResult,
  ThemeProduct,
} from "@/commerce";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Pressable, Text } from "react-native";
import { CommerceProvider, useCommerce } from "../CommerceContext";

class TestCommerceAdapter implements CommerceAdapter {
  products: ThemeProduct[] = [
    {
      themeId: "schoolhouse",
      productId: "theme_schoolhouse",
      displayPrice: "$1.99",
    },
  ];

  ownedThemeIds: string[] = [];

  initialize = jest.fn(async () => {});
  fetchProducts = jest.fn(async () => this.products);
  getOwnedThemeIds = jest.fn(async () => this.ownedThemeIds);
  purchaseProduct = jest.fn(async (productId: string): Promise<PurchaseResult> => {
    if (productId === "theme_schoolhouse") {
      return { status: "success", themeId: "schoolhouse" };
    }
    return { status: "error", message: "Unknown product" };
  });
  restorePurchases = jest.fn(async (): Promise<RestoreResult> => ({
    status: "success",
    restoredThemeIds: ["schoolhouse"],
  }));
}

function CommerceProbe() {
  const commerce = useCommerce();
  const [lastResult, setLastResult] = React.useState("");
  return (
    <>
      <Text testID="loaded">{String(commerce.isLoaded)}</Text>
      <Text testID="products">{String(commerce.products.length)}</Text>
      <Text testID="classic">{commerce.getThemeAvailability("classic")}</Text>
      <Text testID="schoolhouse">
        {commerce.getThemeAvailability("schoolhouse")}
      </Text>
      <Text testID="missing">{commerce.getThemeAvailability("missing")}</Text>
      <Text testID="price">
        {commerce.getProductForTheme("schoolhouse")?.displayPrice ?? ""}
      </Text>
      <Text testID="result">{lastResult}</Text>
      <Pressable
        testID="purchase-schoolhouse"
        onPress={async () => {
          const result = await commerce.purchaseTheme("schoolhouse");
          setLastResult(result.status);
        }}
      >
        <Text>Purchase</Text>
      </Pressable>
      <Pressable
        testID="purchase-missing"
        onPress={async () => {
          const result = await commerce.purchaseTheme("missing");
          setLastResult(result.status);
        }}
      >
        <Text>Missing</Text>
      </Pressable>
      <Pressable
        testID="restore"
        onPress={async () => {
          const result = await commerce.restorePurchases();
          setLastResult(result.status);
        }}
      >
        <Text>Restore</Text>
      </Pressable>
    </>
  );
}

describe("CommerceProvider", () => {
  it("loads products, resolves availability, and updates ownership after purchase", async () => {
    const adapter = new TestCommerceAdapter();
    const { getByTestId } = render(
      <CommerceProvider adapter={adapter}>
        <CommerceProbe />
      </CommerceProvider>,
    );

    await waitFor(() => expect(getByTestId("loaded")).toHaveTextContent("true"));
    expect(getByTestId("products")).toHaveTextContent("1");
    expect(getByTestId("classic")).toHaveTextContent("free");
    expect(getByTestId("schoolhouse")).toHaveTextContent("locked");
    expect(getByTestId("missing")).toHaveTextContent("locked");
    expect(getByTestId("price")).toHaveTextContent("$1.99");

    fireEvent.press(getByTestId("purchase-schoolhouse"));

    await waitFor(() => {
      expect(getByTestId("result")).toHaveTextContent("success");
      expect(getByTestId("schoolhouse")).toHaveTextContent("owned");
    });
    expect(adapter.purchaseProduct).toHaveBeenCalledWith("theme_schoolhouse");
  });

  it("reports missing products and restores owned themes", async () => {
    const adapter = new TestCommerceAdapter();
    const { getByTestId } = render(
      <CommerceProvider adapter={adapter}>
        <CommerceProbe />
      </CommerceProvider>,
    );

    await waitFor(() => expect(getByTestId("loaded")).toHaveTextContent("true"));

    fireEvent.press(getByTestId("purchase-missing"));
    await waitFor(() => expect(getByTestId("result")).toHaveTextContent("error"));

    fireEvent.press(getByTestId("restore"));
    await waitFor(() => {
      expect(getByTestId("result")).toHaveTextContent("success");
      expect(getByTestId("schoolhouse")).toHaveTextContent("owned");
    });
  });

  it("still loads when the adapter is unavailable", async () => {
    const adapter = new TestCommerceAdapter();
    adapter.initialize.mockRejectedValueOnce(new Error("offline"));

    const { getByTestId } = render(
      <CommerceProvider adapter={adapter}>
        <CommerceProbe />
      </CommerceProvider>,
    );

    await waitFor(() => expect(getByTestId("loaded")).toHaveTextContent("true"));
    expect(getByTestId("products")).toHaveTextContent("0");
    expect(getByTestId("schoolhouse")).toHaveTextContent("locked");
  });
});
