import { Team } from "@/engine";
import { CellType } from "@/types/board";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Pressable, Text } from "react-native";
import { LayoutProvider, useLayout } from "../LayoutContext";

const layout = { pageX: 1, pageY: 2, width: 40, height: 40 };

function LayoutProbe() {
  const ctx = useLayout();
  return (
    <>
      <Text testID="ready">{String(ctx.layoutReady)}</Text>
      <Text testID="slots">{String(Object.keys(ctx.slots).length)}</Text>
      <Text testID="spaces">{String(Object.keys(ctx.spaces).length)}</Text>
      <Text testID="corners">{String(Object.keys(ctx.corners).length)}</Text>
      <Text testID="team-one-wells">
        {String(Object.keys(ctx.wells[Team.One]).length)}
      </Text>
      <Text testID="team-two-wells">
        {String(Object.keys(ctx.wells[Team.Two]).length)}
      </Text>
      <Pressable
        testID="register"
        onPress={() => {
          ctx.registerCell({ id: "0-1", type: CellType.Slot, layout });
          ctx.registerCell({ id: "1-1", type: CellType.Space, layout });
          ctx.registerCell({ id: "0-0", type: CellType.Corner, layout });
          ctx.registerCell({
            id: "9-9",
            type: CellType.Well,
            team: Team.One,
            layout,
          });
          ctx.registerCell({
            id: "17-12",
            type: CellType.Well,
            team: Team.Two,
            layout,
          });
        }}
      >
        <Text>Register</Text>
      </Pressable>
    </>
  );
}

describe("LayoutProvider", () => {
  it("tracks registered board, corner, and well layouts", () => {
    const { getByTestId } = render(
      <LayoutProvider>
        <LayoutProbe />
      </LayoutProvider>,
    );

    expect(getByTestId("ready")).toHaveTextContent("false");
    fireEvent.press(getByTestId("register"));

    expect(getByTestId("slots")).toHaveTextContent("1");
    expect(getByTestId("spaces")).toHaveTextContent("1");
    expect(getByTestId("corners")).toHaveTextContent("1");
    expect(getByTestId("team-one-wells")).toHaveTextContent("1");
    expect(getByTestId("team-two-wells")).toHaveTextContent("1");
    expect(getByTestId("ready")).toHaveTextContent("true");
  });
});
