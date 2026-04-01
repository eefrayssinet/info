import { MODELS, TRACKS } from "../data/promptGolfData";
import { buildPromptSeed, formatScoreVsPar, getModelById, simulatePromptTurn } from "./promptGolfEngine";

const STORAGE_KEY = "prompt-golf-classroom-state";
const UPDATE_EVENT = "prompt-golf-classroom-updated";
const TIMEOUT_PENALTY = 3;

function createEmptyState() {
  return {
    version: 1,
    activeSessionId: null,
    sessions: {},
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function generateId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function normalizeMembers(members = []) {
  const filled = [...members, "", "", "", ""].slice(0, 4);

  return filled.map((member) => member.trim());
}

function safeDispatchUpdate() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function persistState(nextState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  safeDispatchUpdate();
}

export function loadClassroomState() {
  if (typeof window === "undefined") {
    return createEmptyState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    return raw ? JSON.parse(raw) : createEmptyState();
  } catch (error) {
    return createEmptyState();
  }
}

export function subscribeClassroomState(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handleStorage(event) {
    if (event.key && event.key !== STORAGE_KEY) {
      return;
    }

    listener(loadClassroomState());
  }

  function handleUpdate() {
    listener(loadClassroomState());
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(UPDATE_EVENT, handleUpdate);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(UPDATE_EVENT, handleUpdate);
  };
}

function mutateState(mutator) {
  const previous = loadClassroomState();
  const draft = clone(previous);
  const result = mutator(draft);
  const previousSerialized = JSON.stringify(previous);
  const nextSerialized = JSON.stringify(draft);

  if (previousSerialized !== nextSerialized) {
    persistState(draft);
    return {
      state: draft,
      result,
      changed: true,
    };
  }

  return {
    state: previous,
    result,
    changed: false,
  };
}

function getTrack(trackId) {
  return TRACKS.find((track) => track.id === trackId) ?? TRACKS[0];
}

function getHole(trackId, holeId) {
  const track = getTrack(trackId);

  return track.holes.find((hole) => hole.id === holeId) ?? track.holes[0];
}

function createRun(holeId, modelId) {
  return {
    holeId,
    modelId,
    promptSeed: buildPromptSeed(
      TRACKS.flatMap((track) => track.holes).find((hole) => hole.id === holeId)
    ),
    status: "pending",
    promptsUsed: 0,
    turns: [],
    completion: 0,
    scoreVsPar: null,
    scoreDisplay: null,
    scoreLabel: null,
    finishReason: null,
    lockedAt: null,
    lastUpdatedAt: null,
  };
}

function ensureRun(team, holeId, modelId) {
  team.holeRuns = team.holeRuns ?? {};
  team.holeRuns[holeId] = team.holeRuns[holeId] ?? createRun(holeId, modelId);

  return team.holeRuns[holeId];
}

function ensureTeamsShape(session) {
  session.teams = session.teams ?? [];

  return session.teams;
}

function getCurrentHoleId(session) {
  return session.holeIds?.[session.activeHoleIndex] ?? null;
}

function closeTeamRun(run, hole, now, reason) {
  if (run.status === "locked" || run.status === "timeout") {
    return;
  }

  if (run.turns.at(-1)?.evaluation?.status === "valid") {
    const scoreVsPar = run.promptsUsed - hole.par;

    run.status = "locked";
    run.scoreVsPar = scoreVsPar;
    run.scoreDisplay = formatScoreVsPar(scoreVsPar);
    run.scoreLabel = scoreVsPar <= 0 ? "validated" : "over par";
    run.finishReason = reason;
    run.lockedAt = now;
    run.lastUpdatedAt = now;
    return;
  }

  run.status = "timeout";
  run.scoreVsPar = TIMEOUT_PENALTY;
  run.scoreDisplay = `+${TIMEOUT_PENALTY}`;
  run.scoreLabel = "timeout";
  run.finishReason = reason;
  run.lockedAt = now;
  run.lastUpdatedAt = now;
}

function shouldMoveToReview(session) {
  const currentHoleId = getCurrentHoleId(session);

  if (!currentHoleId) {
    return false;
  }

  return session.teams.every((team) => {
    const run = team.holeRuns?.[currentHoleId];

    return run && ["locked", "timeout"].includes(run.status);
  });
}

function closeCurrentHole(session, reason, now) {
  const currentHoleId = getCurrentHoleId(session);

  if (!currentHoleId) {
    return;
  }

  const hole = getHole(session.trackId, currentHoleId);

  ensureTeamsShape(session).forEach((team) => {
    const run = ensureRun(team, currentHoleId, session.modelId);

    closeTeamRun(run, hole, now, reason);
  });

  session.phase = "review";
}

function syncSingleSession(session, now) {
  if (session.phase !== "live" || !session.holeStartedAt) {
    return false;
  }

  const deadline = session.holeStartedAt + session.timeLimitSeconds * 1000;

  if (now < deadline) {
    if (shouldMoveToReview(session)) {
      session.phase = "review";
      return true;
    }

    return false;
  }

  closeCurrentHole(session, "timer", now);
  return true;
}

export function syncClassroomTimers(now = Date.now()) {
  return mutateState((state) => {
    let touched = false;

    Object.values(state.sessions).forEach((session) => {
      if (syncSingleSession(session, now)) {
        touched = true;
      }
    });

    return touched;
  }).state;
}

export function getActiveClassroomSession(state) {
  return state.sessions?.[state.activeSessionId] ?? null;
}

export function getRemainingTimeMs(session, now = Date.now()) {
  if (!session) {
    return 0;
  }

  if (session.phase === "review" || session.phase === "finished") {
    return 0;
  }

  if (!session.holeStartedAt || session.phase !== "live") {
    return session?.timeLimitSeconds ? session.timeLimitSeconds * 1000 : 0;
  }

  return Math.max(0, session.holeStartedAt + session.timeLimitSeconds * 1000 - now);
}

export function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function createClassroomSession({
  name,
  trackId,
  modelId,
  holeCount,
  timeLimitSeconds,
  revealMode,
}) {
  const track = getTrack(trackId);
  const sessionId = generateId("CLASS");

  mutateState((state) => {
    state.activeSessionId = sessionId;
    state.sessions[sessionId] = {
      id: sessionId,
      name: name.trim() || `Session ${sessionId}`,
      trackId: track.id,
      modelId: modelId || MODELS[0].id,
      holeIds: track.holes.slice(0, holeCount).map((hole) => hole.id),
      timeLimitSeconds,
      revealMode,
      phase: "setup",
      activeHoleIndex: 0,
      holeStartedAt: null,
      createdAt: new Date().toISOString(),
      teams: [],
    };
  });

  return sessionId;
}

export function setActiveClassroomSession(sessionId) {
  mutateState((state) => {
    if (state.sessions[sessionId]) {
      state.activeSessionId = sessionId;
    }
  });
}

export function deleteClassroomSession(sessionId) {
  mutateState((state) => {
    delete state.sessions[sessionId];

    if (state.activeSessionId === sessionId) {
      state.activeSessionId = Object.keys(state.sessions)[0] ?? null;
    }
  });
}

export function addTeamToSession(sessionId, { name, members }) {
  const teamId = generateId("TEAM");

  mutateState((state) => {
    const session = state.sessions[sessionId];

    if (!session) {
      return;
    }

    ensureTeamsShape(session).push({
      id: teamId,
      name: name.trim() || `Team ${session.teams.length + 1}`,
      members: normalizeMembers(members),
      holeRuns: {},
      createdAt: new Date().toISOString(),
    });
  });

  return teamId;
}

export function removeTeamFromSession(sessionId, teamId) {
  mutateState((state) => {
    const session = state.sessions[sessionId];

    if (!session) {
      return;
    }

    session.teams = ensureTeamsShape(session).filter((team) => team.id !== teamId);
  });
}

export function launchCurrentHole(sessionId) {
  mutateState((state) => {
    const session = state.sessions[sessionId];

    if (!session || session.phase === "finished") {
      return;
    }

    const currentHoleId = getCurrentHoleId(session);

    if (!currentHoleId) {
      session.phase = "finished";
      return;
    }

    const now = Date.now();

    session.phase = "live";
    session.holeStartedAt = now;
    ensureTeamsShape(session).forEach((team) => {
      const run = ensureRun(team, currentHoleId, session.modelId);

      if (run.status === "pending") {
        run.lastUpdatedAt = now;
      }
    });
  });
}

export function closeLiveHole(sessionId) {
  mutateState((state) => {
    const session = state.sessions[sessionId];

    if (!session || session.phase !== "live") {
      return;
    }

    closeCurrentHole(session, "teacher", Date.now());
  });
}

export function advanceClassroomHole(sessionId) {
  mutateState((state) => {
    const session = state.sessions[sessionId];

    if (!session) {
      return;
    }

    if (session.activeHoleIndex >= session.holeIds.length - 1) {
      session.phase = "finished";
      session.holeStartedAt = null;
      return;
    }

    session.activeHoleIndex += 1;
    session.phase = "setup";
    session.holeStartedAt = null;
  });
}

export function submitTeamPrompt(sessionId, teamId, prompt) {
  return mutateState((state) => {
    const session = state.sessions[sessionId];

    if (!session || session.phase !== "live") {
      return null;
    }

    const currentHoleId = getCurrentHoleId(session);

    if (!currentHoleId) {
      return null;
    }

    const now = Date.now();
    const deadline = session.holeStartedAt + session.timeLimitSeconds * 1000;

    if (now >= deadline) {
      closeCurrentHole(session, "timer", now);
      return null;
    }

    const team = ensureTeamsShape(session).find((entry) => entry.id === teamId);

    if (!team) {
      return null;
    }

    const run = ensureRun(team, currentHoleId, session.modelId);

    if (["locked", "timeout"].includes(run.status)) {
      return null;
    }

    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      return null;
    }

    const hole = getHole(session.trackId, currentHoleId);
    const turn = simulatePromptTurn({
      hole,
      modelId: session.modelId,
      prompt: cleanPrompt,
      promptCount: run.turns.length + 1,
    });

    run.turns.push({
      ...turn,
      createdAt: now,
    });
    run.promptsUsed = run.turns.length;
    run.completion = turn.evaluation.completion;
    run.status = turn.evaluation.status === "valid" ? "ready" : "live";
    run.lastUpdatedAt = now;

    return turn;
  }).result;
}

export function lockTeamScore(sessionId, teamId) {
  return mutateState((state) => {
    const session = state.sessions[sessionId];

    if (!session) {
      return false;
    }

    const currentHoleId = getCurrentHoleId(session);

    if (!currentHoleId) {
      return false;
    }

    const now = Date.now();
    const deadline = session.holeStartedAt
      ? session.holeStartedAt + session.timeLimitSeconds * 1000
      : now + 1;

    if (session.phase === "live" && now >= deadline) {
      closeCurrentHole(session, "timer", now);
      return false;
    }

    const team = ensureTeamsShape(session).find((entry) => entry.id === teamId);

    if (!team) {
      return false;
    }

    const run = ensureRun(team, currentHoleId, session.modelId);

    if (run.turns.at(-1)?.evaluation?.status !== "valid") {
      return false;
    }

    const hole = getHole(session.trackId, currentHoleId);

    closeTeamRun(run, hole, now, "manual");

    if (shouldMoveToReview(session)) {
      session.phase = "review";
    }

    return true;
  }).result;
}

export function buildSessionLeaderboard(session) {
  const currentHoleId = getCurrentHoleId(session);
  const isLiveHidden = session.revealMode === "hole" && session.phase === "live";

  return ensureTeamsShape(session)
    .map((team) => {
      const runs = session.holeIds.map((holeId) => team.holeRuns?.[holeId]).filter(Boolean);
      const completedRuns = runs.filter((run) => ["locked", "timeout"].includes(run.status));
      const currentRun = currentHoleId ? team.holeRuns?.[currentHoleId] ?? null : null;
      const validHoles = completedRuns.filter((run) => run.status === "locked").length;
      const totalPrompts = completedRuns.reduce((sum, run) => sum + (run.promptsUsed ?? 0), 0);
      const totalScore = completedRuns.reduce(
        (sum, run) => sum + (typeof run.scoreVsPar === "number" ? run.scoreVsPar : TIMEOUT_PENALTY),
        0
      );

      return {
        id: team.id,
        name: team.name,
        members: team.members,
        currentStatus: currentRun?.status ?? "pending",
        currentPrompts: currentRun?.promptsUsed ?? 0,
        currentScore: currentRun?.scoreDisplay ?? "--",
        currentCompletion: currentRun?.completion ?? 0,
        totalScore,
        totalScoreDisplay: completedRuns.length ? formatScoreVsPar(totalScore) : "--",
        totalPrompts,
        validHoles,
        completedHoles: completedRuns.length,
        revealed: !isLiveHidden,
      };
    })
    .sort((left, right) => {
      if (left.validHoles !== right.validHoles) {
        return right.validHoles - left.validHoles;
      }

      if (left.totalScore !== right.totalScore) {
        return left.totalScore - right.totalScore;
      }

      if (left.totalPrompts !== right.totalPrompts) {
        return left.totalPrompts - right.totalPrompts;
      }

      return left.name.localeCompare(right.name);
    });
}

export function getSessionSummary(session) {
  const track = getTrack(session.trackId);
  const hole = getHole(session.trackId, getCurrentHoleId(session));
  const model = getModelById(session.modelId);

  return {
    track,
    hole,
    model,
  };
}
