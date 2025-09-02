import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import HowToPlay from "@/app/howToPlay";

jest.mock("@/components/BackButton", () => {
  const MockBackButton = () => <></>;
  MockBackButton.displayName = "BackButton";
  return MockBackButton;
});

describe("HowToPlay", () => {
  it("renders Two Player instructions by default", () => {
    const { getByText } = render(<HowToPlay />);
    expect(getByText("How to Play")).toBeTruthy();
    expect(
      expect(
        getByText(/Each player takes a turn dropping a piece/i)
      ).toBeTruthy()
    );
    // expect(getByText("Two Player")).toHaveStyle({ color: "black" });
    // expect(getByText("Four Player")).toHaveStyle({ color: "gray" });
  });
  it("given two player instructions are displayed, when button is pressed, then the page displays four player instructions", () => {
    const { getByText } = render(<HowToPlay />);
    fireEvent.press(getByText("Four Player"));

    expect(getByText(/Players are on teams/i)).toBeTruthy();
    //   expect(getByText("Four Player")).toHaveStyle({ color: "black" });
    //   expect(getByText("Two Player")).toHaveStyle({ color: "gray" });
  });

  it("given four player instructions are displayed, when button is pressed, then the page displays two player instructions", () => {
    const { getByText } = render(<HowToPlay />);
    fireEvent.press(getByText("Four Player"));
    fireEvent.press(getByText("Two Player"));

    expect(
      getByText(/Each player takes a turn dropping a piece/i)
    ).toBeTruthy();
  });
});
