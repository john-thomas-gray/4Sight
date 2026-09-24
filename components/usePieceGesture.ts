import { animateBlockingPieceBump, animateDroppedPieceBlockedInSlot, BLOCKED_DROP_RETURN_START_MS } from "@/animations/blockedSlotDrop";
import { animatePieceReturnToWellResting, PIECE_RETURN_TO_WELL_CENTER_MS, PIECE_RETURN_TO_WELL_TOTAL_MS, PIECE_RETURN_TO_WELL_LOWER_MS } from "@/animations/pieceReturnToWell";
import { animatePieceSlotThroughSpaceDrop, SLOT_CENTER_MS, SLOT_LOWER_IN_SLOT_MS } from "@/animations/pieceSlotThroughSpaceDrop";
import { GameElements } from "@/constants";
import { TURN_CHANGE_COMMIT_DELAY_MS, TURN_CHANGE_SETTLE_BUFFER_MS } from "@/constants/logic";
import { PieceStatus, useGameSessionSelector } from "@/context/GameSessionContext";
import { useLayout } from "@/context/LayoutContext";
import { usePlayfieldFrameOptional } from "@/context/PlayfieldFrameContext";
import { useSettings } from "@/context/SettingsContext";
import { useUiSelector } from "@/context/UiContext";
import { getSlotEntryDirection, Team } from "@/engine";
import { TUTORIAL_STEP_ONE_FOCUS_PIECE_ID } from "@/tutorial/gamePlayTutorialSteps";
import type { PieceAnimation } from "@/types/animation";
import type { CellLayout } from "@/types/board";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import { resolveDropOutcome } from "./pieceDropController";
type Args = {
  id: string;
  team: Team;
  animate: PieceAnimation;
  status: PieceStatus;
  startHeldJiggle: () => void;
  stopHeldJiggle: () => void;
  reversePieceLift: (duration: number, delayMs?: number) => void;
  returnPieceLiftToWell: (holdMs: number) => void;
};
type Target = CellLayout & {
  id: string;
  landingKey: string;
};

/** Motion stays on the animation thread; only pickup, target changes and release enter React. */
export function usePieceGesture({
  id,
  team,
  animate,
  status,
  startHeldJiggle,
  stopHeldJiggle,
  reversePieceLift,
  returnPieceLiftToWell
}: Args) {
  const {
    gameStatus,
    isMyTurn,
    getSessionSnapshot,
    beginPieceDrag,
    returnPieceToWell,
    dropPiece,
    moves,
    pieceAnims,
    tutorialWhiteDropEntryDirectionRef
  } = useGameSessionSelector(session => ({
    gameStatus: session.gameState.status,
    isMyTurn: session.gameState.currentTeam === team && !(session.mode === "onePlayer" && team === Team.Two),
    getSessionSnapshot: session.getSessionSnapshot,
    beginPieceDrag: session.beginPieceDrag,
    returnPieceToWell: session.returnPieceToWell,
    dropPiece: session.dropPiece,
    moves: session.moves,
    pieceAnims: session.pieceAnims,
    tutorialWhiteDropEntryDirectionRef: session.tutorialWhiteDropEntryDirectionRef
  }));
  const {
    moveInProgress,
    setMoveInProgress,
    setHoverPreview,
    tutorialPiecePickupLocked,
    requestTutorialBannerAttention,
    tutorialInaccessibleSlotEntryDirection
  } = useUiSelector(ui => ({
    moveInProgress: ui.moveInProgress,
    setMoveInProgress: ui.setMoveInProgress,
    setHoverPreview: ui.setHoverPreview,
    tutorialPiecePickupLocked: ui.tutorialPiecePickupLocked,
    requestTutorialBannerAttention: ui.requestTutorialBannerAttention,
    tutorialInaccessibleSlotEntryDirection: ui.tutorialInaccessibleSlotEntryDirection
  }));
  const layout = useLayout();
  const playfield = usePlayfieldFrameOptional();
  const fallbackOrigin = useSharedValue({
    x: 0,
    y: 0
  });
  const windowOrigin = playfield?.windowOrigin ?? fallbackOrigin;
  const {
    piecePlacementPreviews
  } = useSettings();
  const active = useSharedValue(false);
  const released = useSharedValue(false);
  const hoverKey = useSharedValue("");
  const targets = useSharedValue<Target[]>([]);
  const origin = useRef<{
    id: string;
    layout: CellLayout;
  } | null>(null);
  const cancellations = useRef(new Set<() => void>());
  const dragYOffset = team === Team.One ? -50 : 50;
  const {
    translateX,
    translateY
  } = animate;
  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const cancel = moves.schedule(() => {
      cancellations.current.delete(cancel);
      callback();
    }, delayMs);
    cancellations.current.add(cancel);
  }, [moves]);
  const publishPreview = useCallback((spaceId: string) => {
    setHoverPreview(prev => spaceId ? prev?.spaceId === spaceId && prev.team === team ? prev : {
      spaceId,
      team
    } : null);
  }, [setHoverPreview, team]);
  const settleInWell = useCallback((wellId?: string) => {
    returnPieceToWell(id, wellId);
    origin.current = null;
    setMoveInProgress(false);
  }, [id, returnPieceToWell, setMoveInProgress]);
  const cancelDrag = useCallback(() => {
    if (!origin.current && cancellations.current.size === 0) {
      active.set(false);
      return;
    }
    active.set(false);
    for (const cancel of cancellations.current) cancel();
    cancellations.current.clear();
    stopHeldJiggle();
    reversePieceLift(PIECE_RETURN_TO_WELL_LOWER_MS);
    setHoverPreview(null);
    if (!origin.current) {
      moves.finish();
      setMoveInProgress(false);
      return;
    }
    const cell = origin.current.layout;
    animatePieceReturnToWellResting(animate, cell.pageX + cell.width / 2 - GameElements.PIECE_RADIUS, cell.pageY + cell.height / 2 - GameElements.PIECE_RADIUS);
    settleInWell();
  }, [active, animate, reversePieceLift, setHoverPreview, settleInWell, stopHeldJiggle, moves, setMoveInProgress]);
  // Only unmount cancels an interaction; changing callbacks during a drag must not cancel it.
  const cancelOnUnmount = useRef(cancelDrag);
  useEffect(() => {
    cancelOnUnmount.current = cancelDrag;
  }, [cancelDrag]);
  useEffect(() => moves.onCancel(() => cancelOnUnmount.current()), [moves]);
  useEffect(() => () => cancelOnUnmount.current(), []);
  const startDrag = useCallback(() => {
    if (tutorialPiecePickupLocked) {
      active.set(false);
      requestTutorialBannerAttention();
      return;
    }
    const snapshot = getSessionSnapshot();
    if (snapshot.mode === "onePlayer" && team === Team.Two) {
      active.set(false);
      return;
    }
    const wellId = Object.entries(snapshot.wellPieceLocations).find(([, pieceId]) => pieceId === id)?.[0];
    const cell = wellId ? layout.wells[team][wellId] : undefined;
    if (!wellId || !cell || !beginPieceDrag(id)) {
      active.set(false);
      return;
    }
    origin.current = {
      id: wellId,
      layout: cell
    };
    playfield?.playfieldRef.current?.measureInWindow((x, y) => {
      windowOrigin.set({
        x,
        y
      });
      if (playfield) playfield.windowOriginRef.current = {
        x,
        y
      };
    });
    targets.set(layout.cellsByTeam[team].flatMap(target => {
      if (!target.layout) return [];
      const outcome = piecePlacementPreviews ? resolveDropOutcome(target.id, snapshot.gameState.board, layout.slots, layout.spaces, layout.wells[team], snapshot.wellPieceLocations, wellId, tutorialInaccessibleSlotEntryDirection) : null;
      return [{
        ...target.layout,
        id: target.id,
        landingKey: outcome?.kind === "placed" ? outcome.landingKey : ""
      }];
    }));
    animate.scaleX.set(GameElements.PIECE_HELD_SCALE);
    animate.scaleY.set(GameElements.PIECE_HELD_SCALE);
    animate.zIndex.set(GameElements.PIECE_HELD_ZINDEX);
    startHeldJiggle();
    setMoveInProgress(true);
    setHoverPreview(null);
  }, [tutorialPiecePickupLocked, active, requestTutorialBannerAttention, getSessionSnapshot, id, layout, team, beginPieceDrag, playfield, windowOrigin, targets, piecePlacementPreviews, tutorialInaccessibleSlotEntryDirection, animate, startHeldJiggle, setMoveInProgress, setHoverPreview]);
  const finishDrag = useCallback((x: number, y: number) => {
    if (!origin.current) return;
    stopHeldJiggle();
    setHoverPreview(null);
    const home = origin.current;
    const snapshot = getSessionSnapshot();
    const hit = layout.cellsByTeam[team].find(cell => cell.layout && x >= cell.layout.pageX && x <= cell.layout.pageX + cell.layout.width && y >= cell.layout.pageY && y <= cell.layout.pageY + cell.layout.height);
    const outcome = hit ? resolveDropOutcome(hit.id, snapshot.gameState.board, layout.slots, layout.spaces, layout.wells[team], snapshot.wellPieceLocations, home.id, tutorialInaccessibleSlotEntryDirection) : {
      kind: "returnToWell" as const
    };
    const returnHome = () => animatePieceReturnToWellResting(animate, home.layout.pageX + home.layout.width / 2 - GameElements.PIECE_RADIUS, home.layout.pageY + home.layout.height / 2 - GameElements.PIECE_RADIUS);
    if (outcome.kind === "placed") {
      const cell = layout.spaces[outcome.landingKey];
      const slot = layout.slots[`${outcome.slotCoord.row}-${outcome.slotCoord.col}`];
      if (cell && slot) {
        animatePieceSlotThroughSpaceDrop(animate, slot, cell);
        reversePieceLift(SLOT_LOWER_IN_SLOT_MS, SLOT_CENTER_MS);
        schedule(() => {
          const result = dropPiece(outcome.slotCoord, id);
          if (!result.events.some(event => event.type === "piece_placed")) {
            cancelDrag();
            return;
          }
          animate.zIndex.set(GameElements.PIECE_BOARD_ZINDEX);
          if (id === TUTORIAL_STEP_ONE_FOCUS_PIECE_ID) tutorialWhiteDropEntryDirectionRef.current = getSlotEntryDirection(outcome.slotCoord);
          origin.current = null;
        }, TURN_CHANGE_COMMIT_DELAY_MS);
        schedule(() => {
          moves.finish();
          setMoveInProgress(false);
        }, TURN_CHANGE_COMMIT_DELAY_MS + TURN_CHANGE_SETTLE_BUFFER_MS);
        return;
      }
    }
    if (outcome.kind === "well") {
      const cell = layout.wells[team][outcome.wellId];
      if (cell) {
        animatePieceReturnToWellResting(animate, cell.pageX + cell.width / 2 - GameElements.PIECE_RADIUS, cell.pageY + cell.height / 2 - GameElements.PIECE_RADIUS);
        returnPieceLiftToWell(PIECE_RETURN_TO_WELL_CENTER_MS);
        schedule(() => settleInWell(outcome.wellId), PIECE_RETURN_TO_WELL_TOTAL_MS);
        return;
      }
    }
    if (outcome.kind === "blockedSlot") {
      const slot = layout.slots[`${outcome.slotCoord.row}-${outcome.slotCoord.col}`];
      const cell = layout.spaces[outcome.blockingKey];
      const blocker = pieceAnims[outcome.blockingPieceId];
      if (slot && cell && blocker) {
        animateDroppedPieceBlockedInSlot(animate, slot, outcome.entryDirection);
        animateBlockingPieceBump(blocker, cell, outcome.entryDirection);
        returnPieceLiftToWell(BLOCKED_DROP_RETURN_START_MS + PIECE_RETURN_TO_WELL_CENTER_MS);
        schedule(returnHome, BLOCKED_DROP_RETURN_START_MS);
        schedule(() => settleInWell(), BLOCKED_DROP_RETURN_START_MS + PIECE_RETURN_TO_WELL_TOTAL_MS);
        return;
      }
    }
    returnHome();
    returnPieceLiftToWell(PIECE_RETURN_TO_WELL_CENTER_MS);
    schedule(() => settleInWell(), PIECE_RETURN_TO_WELL_TOTAL_MS);
  }, [stopHeldJiggle, setHoverPreview, getSessionSnapshot, layout, team, tutorialInaccessibleSlotEntryDirection, animate, reversePieceLift, schedule, dropPiece, id, cancelDrag, tutorialWhiteDropEntryDirectionRef, setMoveInProgress, returnPieceLiftToWell, settleInWell, pieceAnims, moves]);
  /* eslint-disable react-hooks/refs -- Gesture Handler registers callbacks; it does not invoke them during render. */
  return useMemo(() => Gesture.Pan().enabled(status !== PieceStatus.onBoard && status !== PieceStatus.winner && gameStatus === "playing" && isMyTurn && (tutorialPiecePickupLocked || status === PieceStatus.isHeld || !moveInProgress)).hitSlop({
    left: 24,
    right: 24,
    top: 24,
    bottom: 24
  }).onStart(() => {
    "worklet";

    released.set(false);
    active.set(!tutorialPiecePickupLocked);
    hoverKey.set("");
    runOnJS(startDrag)();
  }).onUpdate(event => {
    "worklet";

    if (!active.value) return;
    const x = event.absoluteX - windowOrigin.value.x;
    const y = event.absoluteY - windowOrigin.value.y + dragYOffset;
    translateX.set(x - GameElements.PIECE_RADIUS);
    translateY.set(y - GameElements.PIECE_RADIUS);
    let nextHover = "";
    for (const cell of targets.value) {
      if (x >= cell.pageX && x <= cell.pageX + cell.width && y >= cell.pageY && y <= cell.pageY + cell.height) {
        nextHover = cell.landingKey;
        break;
      }
    }
    if (hoverKey.value !== nextHover) {
      hoverKey.set(nextHover);
      runOnJS(publishPreview)(nextHover);
    }
  }).onEnd(event => {
    "worklet";

    if (!active.value) return;
    released.set(true);
    active.set(false);
    runOnJS(finishDrag)(event.absoluteX - windowOrigin.value.x, event.absoluteY - windowOrigin.value.y + dragYOffset);
  }).onFinalize(() => {
    "worklet";

    if (!released.value && active.value) {
      active.set(false);
      runOnJS(cancelDrag)();
    }
  }), [status, gameStatus, isMyTurn, tutorialPiecePickupLocked, moveInProgress, active, released, hoverKey, startDrag, windowOrigin, dragYOffset, translateX, translateY, targets, publishPreview, finishDrag, cancelDrag]);
  /* eslint-enable react-hooks/refs */
}
