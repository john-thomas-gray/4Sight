import BackButton from "@/components/BackButton";
import { fireEvent, render } from "@testing-library/react-native";

export const useRouter = jest.fn();

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("@/assets/images", () => ({
  images: {
    backArrow: "mock-arrow.png",
  },
}));

describe.only("BackButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders text correctly", () => {
    const { getByText } = render(<BackButton />);

    expect(getByText("Back")).toBeTruthy();
  });

  it("renders image correctly", () => {
    const { getByRole } = render(<BackButton />);

    expect(getByRole("image")).toBeTruthy();

    const image = getByRole("image");

    expect(image.props.source).toBe("mock-arrow.png");
  });

  it("calls router.replace('/') when pressed", () => {
    const { getByText } = render(<BackButton />);

    fireEvent.press(getByText("Back"));
    expect(mockReplace).toHaveBeenCalledWith("/");
  });
});
