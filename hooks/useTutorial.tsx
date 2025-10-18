import TutorialModal from "@/components/TutorialModal";
import TutorialOverlay, { HighlightRect } from "@/components/TutorialOverlay";
import { useGameContext } from "@/context/GameContext";
import { Team } from "@/types/board";
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
      // pick the first well that has a piece
      for (const wellId of Object.keys(teamWells)) {
        const pieceId = logic.wellPieceLocations[wellId];
        if (pieceId) return [wellId, pieceId];
      }
      return null;
    },
    [layout.wells, logic.wellPieceLocations]
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
          logic.setWellPieceLocations((prev) => {
            const next = { ...prev };
            delete next[wellId];
            return next;
          });
          logic.setBoardPieceLocations((prev) => ({
            ...prev,
            [target]: pieceId,
          }));
          // Let Board snap-animate the piece into place on next frame
          setTimeout(() => resolve(), 500);
        }, delayMs);
      });
    },
    [
      getFinalSpaceForSlot,
      getAvailableWellPiece,
      logic.setWellPieceLocations,
      logic.setBoardPieceLocations,
      logic.boardPieceLocations,
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
          setModalText("Players take turns dropping pieces.");
          setShowOverlay(false);
          // After dismiss, we will auto-place a black piece from 0-4
          break;
        }
        case 3: {
          setShowModal(true);
          setModalText("Pieces can be dropped from any side of the board.");
          setShowOverlay(false);
          break;
        }
        case 4: {
          setShowModal(true);
          setModalText(
            "Swipe a direction to shift gravity and make the pieces fall that way."
          );
          // highlight top quarter triangle is complex; keep modal guidance only
          setShowOverlay(false);
          break;
        }
        case 5: {
          setShowModal(true);
          setModalText(
            "If a space is available, you may place a piece directly on it to trigger a drop."
          );
          setShowOverlay(true);
          const r = rectFromCell("7-2");
          setHighlights(r ? [r] : []);
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
            "Winner goes first. Reactivate the tutorial in Settings. Play fair and have fun!"
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

  // advance handlers (simplified)
  const handleModalPress = React.useCallback(() => {
    if (!settings.tutorialEnabled) return;
    if (step === 1) {
      // After reading, allow interaction: dim all except column 4 and white well
      const rects: HighlightRect[] = [];
      for (let row = 0; row <= 7; row++) {
        const id = `${row}-4`;
        const r = rectFromCell(id);
        if (r) rects.push(r);
      }
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
        // Sequence: white 8-2, black 0-2, white 8-1, black 0-5
        (async () => {
          await scriptDropFromSlot(Team.TeamOne, "8-2");
          await scriptDropFromSlot(Team.TeamTwo, "0-2");
          await scriptDropFromSlot(Team.TeamOne, "8-1");
          await scriptDropFromSlot(Team.TeamTwo, "0-5");
          setStep(4);
        })();
        return;
      }
      setStep(step + 1);
      return;
    }
    if (step === 4) {
      // wait for gravity swipe; don't advance on modal
      setShowModal(false);
      return;
    }
    if (step === 5 || step === 6 || step === 7) {
      setShowModal(false);
      setStep(step + 1);
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

  // Detect downward gravity swipe for step 4
  React.useEffect(() => {
    if (step !== 4) return;
    if (logic.lastGravityDirection === "down") {
      setStep(5);
    }
  }, [step, logic.lastGravityDirection]);

  // Detect placement at space 7-2 for step 5
  React.useEffect(() => {
    if (step !== 5) return;
    if (logic.boardPieceLocations["7-2"]) {
      setShowOverlay(false);
      setStep(6);
    }
  }, [step, logic.boardPieceLocations]);

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
