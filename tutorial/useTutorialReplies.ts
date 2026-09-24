import { PieceStatus, useGameSession } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { useUiSelector } from "@/context/UiContext";
import { runScriptedPlaceFromWell } from "@/dev/scriptedPlaceFromWell";
import { Direction, getSlotEntryDirection, Team } from "@/engine";
import { findTutorialBlackStackSlotAboveWhite, pickLowestBlackPieceIdInWells } from "./computeTutorialBlackStackSlot";
import { TUTORIAL_STEP_ONE_FOCUS_PIECE_ID } from "./gamePlayTutorialSteps";
import { useEffect, useRef } from "react";
export function useTutorialReplies(scenarioParam: string | undefined, resolvedTutorialStepParam: string | undefined) {
  const {
    gameState,
    pieceStatusMap,
    wellPieceLocations,
    moves,
    beginPieceDrag,
    returnPieceToWell,
    pieceAnims,
    dropPiece,
    tutorialWhiteDropEntryDirectionRef,
    positionRevision
  } = useGameSession();
  const layout = useLayout();
  const setMoveInProgress = useUiSelector(ui => ui.setMoveInProgress);
  const tutorialBlackStackDemoPlayedRef = useRef(false);
  const tutorialSecondBlackStackDemoPlayedRef = useRef(false);
  const tutorialFirstBlackSlotEntryRef = useRef<Direction | null>(null);
  const prevResolvedTutorialStepRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    tutorialBlackStackDemoPlayedRef.current = false;
    tutorialSecondBlackStackDemoPlayedRef.current = false;
    tutorialFirstBlackSlotEntryRef.current = null;
  }, [scenarioParam, positionRevision]);
  useEffect(() => {
    const prev = prevResolvedTutorialStepRef.current;
    prevResolvedTutorialStepRef.current = resolvedTutorialStepParam;
    if (resolvedTutorialStepParam === "3" && prev === "2") {
      tutorialSecondBlackStackDemoPlayedRef.current = false;
    }
  }, [resolvedTutorialStepParam]);

  /** After step 2 wells settle, black stacks on white from a different edge than white used. */
  useEffect(() => {
    if (!scenarioParam?.startsWith("tutorial")) return;
    if (resolvedTutorialStepParam !== "2") return;
    if (!layout.layoutReady) return;
    if (Object.keys(wellPieceLocations).length < 40) return;
    if (pieceStatusMap[TUTORIAL_STEP_ONE_FOCUS_PIECE_ID] !== PieceStatus.onBoard) {
      return;
    }
    if (gameState.currentTeam !== Team.Two) return;
    if (gameState.status !== "playing") return;
    if (tutorialBlackStackDemoPlayedRef.current) return;
    const whiteId = TUTORIAL_STEP_ONE_FOCUS_PIECE_ID;
    const slot = findTutorialBlackStackSlotAboveWhite(gameState.board, whiteId, tutorialWhiteDropEntryDirectionRef.current);
    const blackId = pickLowestBlackPieceIdInWells(wellPieceLocations);
    if (!slot || !blackId) return;
    const delayMs = 950;
    let cancelled = false;
    const cancel = moves.schedule(() => {
      if (cancelled) return;
      tutorialBlackStackDemoPlayedRef.current = true;
      tutorialFirstBlackSlotEntryRef.current = getSlotEntryDirection(slot) ?? null;
      runScriptedPlaceFromWell({
        moves,
        beginPieceDrag,
        returnPieceToWell,
        board: gameState.board,
        slotCoord: slot,
        pieceId: blackId,
        layout: {
          slots: layout.slots,
          spaces: layout.spaces
        },
        pieceAnims,
        setMoveInProgress,
        dropPiece
      });
    }, delayMs);
    return () => {
      cancelled = true;
      cancel();
    };
  }, [moves, beginPieceDrag, returnPieceToWell, scenarioParam, resolvedTutorialStepParam, layout.layoutReady, layout.slots, layout.spaces, wellPieceLocations, pieceStatusMap, gameState.board, gameState.currentTeam, gameState.status, pieceAnims, setMoveInProgress, dropPiece, tutorialWhiteDropEntryDirectionRef]);

  /** After player's second drop (step 3), second scripted black before the win lesson. */
  useEffect(() => {
    if (!scenarioParam?.startsWith("tutorial")) return;
    if (resolvedTutorialStepParam !== "3") return;
    if (!layout.layoutReady) return;
    if (Object.keys(wellPieceLocations).length < 40) return;
    if (pieceStatusMap[TUTORIAL_STEP_ONE_FOCUS_PIECE_ID] !== PieceStatus.onBoard) {
      return;
    }
    if (gameState.currentTeam !== Team.Two) return;
    if (gameState.status !== "playing") return;
    if (tutorialSecondBlackStackDemoPlayedRef.current) return;
    const whiteId = TUTORIAL_STEP_ONE_FOCUS_PIECE_ID;
    const slot = findTutorialBlackStackSlotAboveWhite(gameState.board, whiteId, tutorialFirstBlackSlotEntryRef.current);
    const blackId = pickLowestBlackPieceIdInWells(wellPieceLocations);
    if (!slot || !blackId) return;
    const delayMs = 950;
    let cancelled = false;
    const cancel = moves.schedule(() => {
      if (cancelled) return;
      tutorialSecondBlackStackDemoPlayedRef.current = true;
      runScriptedPlaceFromWell({
        moves,
        beginPieceDrag,
        returnPieceToWell,
        board: gameState.board,
        slotCoord: slot,
        pieceId: blackId,
        layout: {
          slots: layout.slots,
          spaces: layout.spaces
        },
        pieceAnims,
        setMoveInProgress,
        dropPiece
      });
    }, delayMs);
    return () => {
      cancelled = true;
      cancel();
    };
  }, [moves, beginPieceDrag, returnPieceToWell, scenarioParam, resolvedTutorialStepParam, layout.layoutReady, layout.slots, layout.spaces, wellPieceLocations, pieceStatusMap, gameState.board, gameState.currentTeam, gameState.status, pieceAnims, setMoveInProgress, dropPiece]);
}
