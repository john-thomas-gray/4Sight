import { measureLayoutRelativeToPlayfield } from "../PlayfieldFrameContext";

describe("measureLayoutRelativeToPlayfield", () => {
  it("falls back to absolute page coordinates without a playfield ref", () => {
    const onMeasured = jest.fn();
    const element = {
      measure: jest.fn((cb) => cb(0, 0, 30, 40, 100, 200)),
    };

    measureLayoutRelativeToPlayfield(
      { current: element } as never,
      { current: null },
      onMeasured,
    );

    expect(onMeasured).toHaveBeenCalledWith({
      pageX: 100,
      pageY: 200,
      width: 30,
      height: 40,
    });
  });

  it("normalizes element coordinates to the playfield origin", () => {
    const onMeasured = jest.fn();
    const element = {
      measureInWindow: jest.fn((cb) => cb(130, 260, 30, 40)),
    };
    const playfield = {
      measureInWindow: jest.fn((cb) => cb(100, 200, 300, 400)),
    };

    measureLayoutRelativeToPlayfield(
      { current: element } as never,
      { current: playfield } as never,
      onMeasured,
    );

    expect(onMeasured).toHaveBeenCalledWith({
      pageX: 30,
      pageY: 60,
      width: 30,
      height: 40,
    });
  });
});
