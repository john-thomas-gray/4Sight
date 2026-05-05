import { render } from "@testing-library/react-native";
import React from "react";
import { View } from "react-native";
import BoardGridView from "../BoardGridView";

const mockCorner = ({ id }: { id: string }) => (
  <View testID="corner" nativeID={id} />
);
const mockSlot = ({ id }: { id: string }) => (
  <View testID="slot" nativeID={id} />
);
const mockSpace = ({ id }: { id: string }) => (
  <View testID="space" nativeID={id} />
);

jest.mock("../Corner", () => ({
  __esModule: true,
  default: mockCorner,
}));

jest.mock("../Slot", () => ({
  __esModule: true,
  default: mockSlot,
}));

jest.mock("../Space", () => ({
  __esModule: true,
  default: mockSpace,
}));

describe("BoardGridView", () => {
  it("renders the full 9x9 playfield frame with corners, slots, and spaces", () => {
    const { getAllByTestId } = render(<BoardGridView />);

    expect(getAllByTestId("corner")).toHaveLength(4);
    expect(getAllByTestId("slot")).toHaveLength(28);
    expect(getAllByTestId("space")).toHaveLength(49);
  });
});
