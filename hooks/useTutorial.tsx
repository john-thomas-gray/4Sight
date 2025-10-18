import {
  animatePieceDrop,
  animatePiecePickup,
  animatePieceRelease,
  animateToSelectedCell,
} from "@/animations/pieceAnimations";
import TutorialModal from "@/components/TutorialModal";
import TutorialOverlay, { HighlightRect } from "@/components/TutorialOverlay";
import { SLOT_INSERT, SLOT_TO_SPACE } from "@/constants/animations";
import { useGameContext } from "@/context/GameContext";
import { CellType, Team } from "@/types/board";
import { GameState } from "@/types/logic";
import React from "react";

type TutorialAPI = {
  overlay: React.ReactNode | null;
  modal: React.ReactNode | null;
};

function useTutorial(): TutorialAPI {
  const { settings, layout, logic } = useGameContext();
  const [step, setStep] = React.useState<number>(0);
  const [highlights, setHighlights] = React.useState<HighlightRect[]>([]);
  const [modalText, setModalText] = React.useState<string>("");
  const [showOverlay, setShowOverlay] = React.useState<boolean>(false);
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const completedRef = React.useRef<boolean>(false);
  const usedPieceIdsRef = React.useRef<Set<string>>(new Set());

  // Helpers
  const getFinalSpaceForSlot = React.useCallback(
    (slotId: string, board: Record<string, string>): string | null => {
      const [rStr, cStr] = slotId.split("-");
      const r = Number(rStr);
      const c = Number(cStr);
      if (Number.isNaN(r) || Number.isNaN(c)) return null;
      // Top edge: r===0 -> move down (+row)
      if (r === 0 && c > 0 && c < 8) {
        let target = 1;
        for (let row = 1; row <= 7; row++) {
          if (!board[`${row}-${c}`]) target = row;
          else break;
        }
        return `${target}-${c}`;
      }
      // Bottom edge: r===8 -> move up (-row)
      if (r === 8 && c > 0 && c < 8) {
        let target = 7;
        for (let row = 7; row >= 1; row--) {
          if (!board[`${row}-${c}`]) target = row;
          else break;
        }
        return `${target}-${c}`;
      }
      // Left edge: c===0 -> move right (+col)
      if (c === 0 && r > 0 && r < 8) {
        let target = 1;
        for (let col = 1; col <= 7; col++) {
          if (!board[`${r}-${col}`]) target = col;
          else break;
        }
        return `${r}-${target}`;
      }
      // Right edge: c===8 -> move left (-col)
      if (c === 8 && r > 0 && r < 8) {
        let target = 7;
        for (let col = 7; col >= 1; col--) {
          if (!board[`${r}-${col}`]) target = col;
          else break;
        }
        return `${r}-${target}`;
      }
      return null;
    },
    []
  );

  const getAvailableWellPiece = React.useCallback(
    (team: Team): [string, string] | null => {
      const teamWells = layout.wells[team] || {};
      // Choose the first well that still maps to a piece id that hasn't been used and isn't on board
      for (const wellId of Object.keys(teamWells)) {
        const pieceId = logic.wellPieceLocations[wellId];
        if (!pieceId) continue;
        if (usedPieceIdsRef.current.has(pieceId)) continue;
        // sanity: skip if already on the board
        const alreadyOnBoard = Object.values(
          logic.boardPieceLocations || {}
        ).includes(pieceId);
        if (alreadyOnBoard) continue;
        usedPieceIdsRef.current.add(pieceId);
        return [wellId, pieceId];
      }
      return null;
    },
    [layout.wells, logic.wellPieceLocations, logic.boardPieceLocations]
  );

  const scriptDropFromSlot = React.useCallback(
    (team: Team, slotId: string, delayMs = 0): Promise<void> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const target = getFinalSpaceForSlot(
            slotId,
            logic.boardPieceLocations
          );
          const available = getAvailableWellPiece(team);
          if (!target || !available) {
            resolve();
            return;
          }
          const [wellId, pieceId] = available;
          const anim = logic.pieceAnimations[pieceId];
          const slotLayout = layout.slots[slotId];
          const spaceLayout = layout.spaces[target];
          if (!anim || !slotLayout || !spaceLayout) {
            resolve();
            return;
          }
          // Remove from well immediately so well mapping updates
          logic.setWellPieceLocations((prev) => {
            const next = { ...prev };
            delete next[wellId];
            return next;
          });

          // 1) Mark move in progress and pick up
          logic.setMoveInProgress(true);
          animatePiecePickup({
            scaleX: anim.scaleX,
            scaleY: anim.scaleY,
            zIndex: anim.zIndex,
          });

          // 2) Wait 500ms, move to slot center
          setTimeout(() => {
            animateToSelectedCell({
              translateX: anim.translateX,
              translateY: anim.translateY,
              selectedCell: {
                id: slotId,
                layout: slotLayout,
                type: CellType.Slot,
              } as any,
            });

            // 3) Wait 500ms, release (sets placed scale), then drop into final space
            setTimeout(() => {
              animatePieceRelease({
                scaleX: anim.scaleX,
                scaleY: anim.scaleY,
                zIndex: anim.zIndex,
              });
              animatePieceDrop({
                translateX: anim.translateX,
                translateY: anim.translateY,
                slotLayout,
                spaceLayout,
              });

              // 4) After drop animation finishes, update board mapping, trigger finish check, and resolve
              const totalDropMs = SLOT_INSERT + SLOT_TO_SPACE;
              setTimeout(() => {
                logic.setBoardPieceLocations((prev) => {
                  const updated = { ...prev, [target]: pieceId } as Record<
                    string,
                    string
                  >;
                  try {
                    logic.checkGameFinished(updated);
                  } catch {}
                  return updated;
                });
                logic.setMoveInProgress(false);
                resolve();
              }, totalDropMs + 10);
            }, 500);
          }, 500);
        }, delayMs);
      });
    },
    [
      getFinalSpaceForSlot,
      getAvailableWellPiece,
      layout.slots,
      layout.spaces,
      logic.boardPieceLocations,
      logic.pieceAnimations,
      logic.setBoardPieceLocations,
      logic.setWellPieceLocations,
    ]
  );

  // boot
  React.useEffect(() => {
    if (!settings.tutorialEnabled) return;
    if (!layout.layoutReady) return;
    if (step !== 0) return;
    // Start tutorial
    setStep(1);
  }, [settings.tutorialEnabled, layout.layoutReady, step]);

  // compute helper
  const rectFromCell = React.useCallback(
    (id: string): HighlightRect | null => {
      const cell = layout.spaces[id] || layout.slots[id] || layout.corners[id];
      if (!cell) return null;
      return {
        x: cell.pageX,
        y: cell.pageY,
        width: cell.width,
        height: cell.height,
      };
    },
    [layout]
  );

  // step machine
  React.useEffect(() => {
    if (!settings.tutorialEnabled) return;
    if (!layout.layoutReady) return;

    const run = async () => {
      switch (step) {
        case 1: {
          setModalText(
            "Drag a piece and release over a slot to drop the piece into the board."
          );
          setShowModal(true);
          // focus highlights after modal tap
          break;
        }
        case 2: {
          // After user places a white piece, script a black piece drop
          setShowModal(true);
          setModalText("Players take turns dropping a piece.");
          setShowOverlay(false);
          // After dismiss, we will auto-place a black piece from 0-4
          break;
        }
        case 3: {
          setShowModal(true);
          setModalText("A piece can be dropped from any side of the board.");
          setShowOverlay(false);
          break;
        }
        case 4: {
          setShowModal(true);
          setModalText(
            "You can also drop by placing a piece directly on a reachable space."
          );
          setShowOverlay(false);
          const rects: HighlightRect[] = [];
          const r = rectFromCell("1-2");
          if (r) rects.push(r);
          // Include white team wells
          Object.keys(layout.wells[Team.TeamOne] || {}).forEach((wid) => {
            const wellLayout = layout.wells[Team.TeamOne][wid];
            rects.push({
              x: wellLayout.pageX,
              y: wellLayout.pageY,
              width: wellLayout.width,
              height: wellLayout.height,
            });
          });
          setHighlights(rects);
          break;
        }
        case 5: {
          setShowModal(true);
          setModalText(
            "Swipe a direction to shift gravity and make the pieces fall that way."
          );
          setShowOverlay(false);
          try {
            logic.setRestrictGravityToDown &&
              logic.setRestrictGravityToDown(true);
          } catch {}
          break;
        }
        case 6: {
          setShowModal(true);
          setModalText(
            "The first player to get four in a row horizontally, vertically or diagonally wins the game!"
          );
          setShowOverlay(false);
          break;
        }
        case 7: {
          setShowModal(true);
          setModalText("Shake your device at any time to restart the game.");
          setShowOverlay(false);
          break;
        }
        case 8: {
          setShowModal(true);
          setModalText(
            "Winner goes first. Go to Settings to replay the tutorial. Have fun!"
          );
          setShowOverlay(false);
          completedRef.current = true;
          break;
        }
        default:
          break;
      }
    };
    run();
  }, [step, settings.tutorialEnabled, layout.layoutReady]);

  const step5ArmedRef = React.useRef(false);
  const step5BaselineRef = React.useRef<string | undefined>(undefined);
  const step5ObservedChangeRef = React.useRef(false);
  React.useEffect(() => {
    if (step === 5 && !step5ArmedRef.current) {
      step5ArmedRef.current = true;
      step5ObservedChangeRef.current = false;
      step5BaselineRef.current = logic.lastGravityDirection;
      try {
        logic.setLastGravityDirection &&
          logic.setLastGravityDirection(undefined);
      } catch {}
    }
    if (step !== 5) {
      step5ArmedRef.current = false;
      step5ObservedChangeRef.current = false;
      step5BaselineRef.current = undefined;
    }
  }, [step, logic.setLastGravityDirection]);

  // Track that a new gravity swipe occurred after arming step 5
  React.useEffect(() => {
    if (step !== 5) return;
    if (!step5ArmedRef.current) return;
    if (logic.lastGravityDirection !== step5BaselineRef.current) {
      step5ObservedChangeRef.current = true;
    }
  }, [step, logic.lastGravityDirection]);

  // advance handlers (simplified)
  const handleModalPress = React.useCallback(() => {
    if (!settings.tutorialEnabled) return;
    if (step === 1) {
      // After reading, allow interaction: dim all except column 4 and white well
      const rects: HighlightRect[] = [];
      // Include visible white team wells
      Object.keys(layout.wells[Team.TeamOne] || {}).forEach((wid) => {
        const wellLayout = layout.wells[Team.TeamOne][wid];
        rects.push({
          x: wellLayout.pageX,
          y: wellLayout.pageY,
          width: wellLayout.width,
          height: wellLayout.height,
        });
      });
      const r = rectFromCell("0-4");
      if (r) rects.push(r);
      setHighlights(rects);
      setShowOverlay(true);
      setShowModal(false);
      return;
    }
    if (step === 2 || step === 3) {
      setShowModal(false);
      if (step === 2) {
        // Black piece from top center 0-4
        scriptDropFromSlot(Team.TeamTwo, "0-4").then(() => setStep(3));
        return;
      }
      if (step === 3) {
        // Sequence: white 6-0, black 0-4, white 7-8, black 8-1
        (async () => {
          await scriptDropFromSlot(Team.TeamOne, "6-0");
          await scriptDropFromSlot(Team.TeamTwo, "0-4");
          await scriptDropFromSlot(Team.TeamOne, "7-8");
          await scriptDropFromSlot(Team.TeamTwo, "8-1");
          setStep(4);
        })();
        return;
      }
      setStep(step + 1);
      return;
    }
    if (step === 4) {
      // Do not advance; wait for placement at 1-2
      setShowModal(false);
      setShowOverlay(true);
      return;
    }
    if (step === 6) {
      setShowModal(false);
      setStep(step + 1);
      return;
    }
    if (step === 7) {
      // Do not advance; require device shake reset to progress
      setShowModal(false);
      return;
    }
    if (step === 5) {
      // wait for gravity swipe; don't advance on modal
      setShowModal(false);
      return;
    }
    if (step === 8) {
      setShowModal(false);
      // Auto-disable
      settings.setTutorialEnabled(false);
    }
  }, [step, settings.tutorialEnabled, rectFromCell]);

  // detect user white placement to move from step 1 -> 2
  React.useEffect(() => {
    if (step !== 1) return;
    if (
      logic.gameState !== GameState.Playing &&
      logic.gameState !== GameState.Ready
    )
      return;
    const whiteIds = Object.entries(logic.pieces)
      .filter(([, p]) => p.team === Team.TeamOne)
      .map(([id]) => id);
    const placed = Object.entries(logic.boardPieceLocations).some(([, pid]) =>
      whiteIds.includes(pid)
    );
    if (placed) {
      setShowOverlay(false);
      setStep(2);
    }
  }, [step, logic.boardPieceLocations, logic.pieces]);

  // reset tutorial if leaving uncompleted
  React.useEffect(() => {
    return () => {
      if (!completedRef.current) {
        setStep(0);
        setShowOverlay(false);
        setShowModal(false);
        setHighlights([]);
      }
    };
  }, []);

  // Detect downward gravity swipe for step 5
  React.useEffect(() => {
    if (step !== 5) return;
    if (!step5ObservedChangeRef.current) return;
    if (logic.lastGravityDirection === "down") {
      setStep(6);
    }
  }, [step, logic.lastGravityDirection]);

  // When leaving step 5 (advance or otherwise), clear the restriction
  React.useEffect(() => {
    if (step === 5) return;
    try {
      logic.setRestrictGravityToDown && logic.setRestrictGravityToDown(false);
    } catch {}
  }, [step]);

  // Detect device shake to move from step 7 -> 8 (game reset)
  React.useEffect(() => {
    if (step !== 7) return;
    // When game state changes to Ready due to shake-triggered reset, advance
    if (logic.gameState === GameState.Ready) {
      setShowModal(false);
      setStep(8);
    }
  }, [step, logic.gameState]);

  // Detect placement at space 1-2 for step 4 (use piece/team-aware logic)
  React.useEffect(() => {
    if (step !== 4) return;
    const whiteIds = Object.entries(logic.pieces)
      .filter(([, p]) => p.team === Team.TeamOne)
      .map(([id]) => id);
    const pid = logic.boardPieceLocations["1-2"];
    const placedAtOneTwo = pid ? whiteIds.includes(pid) : false;
    if (placedAtOneTwo) {
      setShowOverlay(false);
      const t = setTimeout(() => setStep(5), SLOT_INSERT + SLOT_TO_SPACE + 10);
      return () => clearTimeout(t);
    }
  }, [step, logic.boardPieceLocations, logic.pieces]);

  return {
    overlay: (
      <TutorialOverlay
        visible={showOverlay && settings.tutorialEnabled}
        highlights={highlights}
      />
    ),
    modal: (
      <TutorialModal
        visible={showModal && settings.tutorialEnabled}
        text={modalText}
        onPress={handleModalPress}
      />
    ),
  };
}

export default useTutorial;
export { useTutorial };
