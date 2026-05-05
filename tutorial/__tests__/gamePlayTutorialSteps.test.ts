import { Team } from "@/engine";
import { PieceStatus, type PieceStatusMap } from "@/types/pieceStatus";
import {
  countPiecesOnBoard,
  getResolvedGamePlayTutorialStepParam,
  resolveGamePlayTutorialStep,
  TUTORIAL_STEP_ONE_FOCUS_PIECE_ID,
  TUTORIAL_STEP_ONE_GAMEPLAY_PATH,
} from "../gamePlayTutorialSteps";

function mapWith(statuses: Record<string, PieceStatus>): PieceStatusMap {
  return statuses;
}

describe("game play tutorial steps", () => {
  it("resolves tutorial URLs and in-place handoff steps", () => {
    expect(TUTORIAL_STEP_ONE_GAMEPLAY_PATH).toBe(
      "/gamePlay?scenario=tutorialStep1&tutorialStep=1",
    );
    expect(
      getResolvedGamePlayTutorialStepParam("tutorialStep1", "1", "4"),
    ).toBe("4");
    expect(
      getResolvedGamePlayTutorialStepParam("tutorialStep4", "4", "1"),
    ).toBe("4");
    expect(getResolvedGamePlayTutorialStepParam(undefined, undefined, "1")).toBe(
      "1",
    );

    expect(resolveGamePlayTutorialStep("tutorialStep1", "1")?.id).toBe(
      "tutorialStep1",
    );
    expect(resolveGamePlayTutorialStep("tutorialStep1", "8")?.id).toBe(
      "tutorialStep8",
    );
    expect(resolveGamePlayTutorialStep("notTutorial", "1")).toBeNull();
  });

  it("drives step 1 pickup, drop hint, and completion states", () => {
    const step = resolveGamePlayTutorialStep("tutorialStep1", "1");
    expect(step).not.toBeNull();

    expect(
      step?.wellPieceIdlePulseActive(
        mapWith({ [TUTORIAL_STEP_ONE_FOCUS_PIECE_ID]: PieceStatus.inWell }),
      ),
    ).toBe(true);
    expect(
      step?.slotDropHintActive(
        mapWith({ [TUTORIAL_STEP_ONE_FOCUS_PIECE_ID]: PieceStatus.isHeld }),
      ),
    ).toBe(true);
    expect(
      step?.isComplete(
        mapWith({ [TUTORIAL_STEP_ONE_FOCUS_PIECE_ID]: PieceStatus.onBoard }),
      ),
    ).toBe(true);
  });

  it("counts board pieces and gates stack/drop tutorial progress", () => {
    const step = resolveGamePlayTutorialStep("tutorialStep1", "2");
    const twoOnBoard = mapWith({
      "0": PieceStatus.onBoard,
      "24": PieceStatus.onBoard,
    });
    const threeOnBoard = mapWith({
      ...twoOnBoard,
      "1": PieceStatus.onBoard,
    });

    expect(countPiecesOnBoard(twoOnBoard)).toBe(2);
    expect(step?.showBanner(twoOnBoard, {
      stepTwoBlackStacksOnWhiteComplete: true,
      winLessonBannerReady: false,
      gravityLessonBannerReady: false,
      defenseLessonBannerReady: false,
      shakeLessonBannerReady: false,
      tutorialStep8BannerReady: false,
    })).toBe(true);
    expect(step?.isComplete(twoOnBoard)).toBe(false);
    expect(step?.isComplete(threeOnBoard)).toBe(true);
  });

  it("requires the win animation hold before completing the win lesson", () => {
    const step = resolveGamePlayTutorialStep("tutorialStep1", "4");
    const context = {
      currentTurnCount: 4,
      currentStatus: "finished" as const,
      currentWinner: Team.One,
      boardOccupiedCount: 9,
      gravityLessonBannerBaselineTurn: null,
      gravityLessonBannerBaselineOnBoardCount: null,
      defenseLessonBannerBaselineTurn: null,
      defenseLessonBannerBaselineOnBoardCount: null,
      tutorialStep4WinHoldComplete: false,
      tutorialStep8OutroComplete: false,
    };

    expect(step?.isComplete({}, context)).toBe(false);
    expect(
      step?.isComplete({}, { ...context, tutorialStep4WinHoldComplete: true }),
    ).toBe(true);
  });

  it("completes gravity and defense lessons only after the same pieces move on a later turn", () => {
    const gravity = resolveGamePlayTutorialStep("tutorialStep1", "5");
    const defense = resolveGamePlayTutorialStep("tutorialStep1", "6");
    const boardMap = mapWith({
      "0": PieceStatus.onBoard,
      "1": PieceStatus.onBoard,
    });
    const baselineContext = {
      currentTurnCount: 10,
      currentStatus: "playing" as const,
      currentWinner: null,
      boardOccupiedCount: 2,
      gravityLessonBannerBaselineTurn: 10,
      gravityLessonBannerBaselineOnBoardCount: 2,
      defenseLessonBannerBaselineTurn: 10,
      defenseLessonBannerBaselineOnBoardCount: 2,
      tutorialStep4WinHoldComplete: false,
      tutorialStep8OutroComplete: false,
    };

    expect(gravity?.isComplete(boardMap, baselineContext)).toBe(false);
    expect(
      gravity?.isComplete(boardMap, {
        ...baselineContext,
        currentTurnCount: 11,
      }),
    ).toBe(true);
    expect(
      defense?.isComplete(boardMap, {
        ...baselineContext,
        currentTurnCount: 11,
      }),
    ).toBe(true);
    expect(
      defense?.isComplete(
        { ...boardMap, "2": PieceStatus.onBoard },
        {
          ...baselineContext,
          currentTurnCount: 11,
        },
      ),
    ).toBe(false);
  });

  it("requires an empty reset board before outro and waits for outro completion", () => {
    const shake = resolveGamePlayTutorialStep("tutorialStep1", "7");
    const outro = resolveGamePlayTutorialStep("tutorialStep1", "8");
    const emptyResetContext = {
      currentTurnCount: 0,
      currentStatus: "playing" as const,
      currentWinner: null,
      boardOccupiedCount: 0,
      gravityLessonBannerBaselineTurn: null,
      gravityLessonBannerBaselineOnBoardCount: null,
      defenseLessonBannerBaselineTurn: null,
      defenseLessonBannerBaselineOnBoardCount: null,
      tutorialStep4WinHoldComplete: false,
      tutorialStep8OutroComplete: false,
    };

    expect(shake?.isComplete({}, emptyResetContext)).toBe(true);
    expect(outro?.isComplete({}, emptyResetContext)).toBe(false);
    expect(
      outro?.isComplete({}, {
        ...emptyResetContext,
        tutorialStep8OutroComplete: true,
      }),
    ).toBe(true);
  });
});
