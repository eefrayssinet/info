import { TRACKS } from "../data/promptGolfData";
import {
  buildPromptSeed,
  formatScoreVsPar,
  getHoleById,
  getModelById,
  getScoreLabel,
  getTrackById,
  simulatePromptTurn,
} from "./promptGolfEngine";
import { ensureSupabaseAnonymousSession, hasSupabaseConfig, supabase } from "./supabaseClient";

const CLASSROOM_SESSION_SELECT = `
  *,
  classroom_teams (
    *,
    classroom_team_runs (
      *,
      classroom_prompt_turns (*)
    )
  )
`;

const TIMEOUT_PENALTY = 3;

function sortByCreatedAt(left, right) {
  return new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
}

function mapTurnRecord(turn) {
  return {
    prompt: turn.prompt,
    promptCount: turn.prompt_count,
    telemetry: turn.telemetry ?? {},
    output: turn.output,
    evaluation: turn.evaluation ?? {},
    createdAt: turn.created_at,
  };
}

function mapRunRecord(run) {
  const turns = [...(run.classroom_prompt_turns ?? [])]
    .sort((left, right) => left.prompt_count - right.prompt_count)
    .map(mapTurnRecord);

  return {
    id: run.id,
    holeId: run.hole_id,
    modelId: run.model_id,
    promptSeed: run.prompt_seed,
    status: run.status,
    promptsUsed: run.prompts_used,
    turns,
    completion: run.completion,
    scoreVsPar: run.score_vs_par,
    scoreDisplay: run.score_display,
    scoreLabel: run.score_label,
    finishReason: run.finish_reason,
    lockedAt: run.locked_at,
    lastUpdatedAt: run.last_updated_at,
  };
}

function mapTeamRecord(team) {
  const holeRuns = Object.fromEntries(
    [...(team.classroom_team_runs ?? [])]
      .sort(sortByCreatedAt)
      .map((run) => [run.hole_id, mapRunRecord(run)])
  );

  return {
    id: team.id,
    name: team.name,
    members: team.members ?? ["", "", "", ""],
    holeRuns,
    createdAt: team.created_at,
  };
}

export function mapSessionRecord(session) {
  return {
    id: session.id,
    name: session.name,
    trackId: session.track_id,
    modelId: session.model_id,
    holeIds: session.hole_ids ?? [],
    timeLimitSeconds: session.time_limit_seconds,
    revealMode: session.reveal_mode,
    phase: session.phase,
    activeHoleIndex: session.active_hole_index,
    holeStartedAt: session.hole_started_at ? new Date(session.hole_started_at).getTime() : null,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    teams: [...(session.classroom_teams ?? [])].sort(sortByCreatedAt).map(mapTeamRecord),
  };
}

function getCurrentHoleId(session) {
  return session.holeIds?.[session.activeHoleIndex] ?? null;
}

function finalizeRun(run, hole, reason, now) {
  const lastTurn = run.turns.at(-1);

  if (lastTurn?.evaluation?.status === "valid") {
    const scoreVsPar = run.promptsUsed - hole.par;

    return {
      ...run,
      status: "locked",
      scoreVsPar,
      scoreDisplay: formatScoreVsPar(scoreVsPar),
      scoreLabel: getScoreLabel(scoreVsPar),
      finishReason: reason,
      lockedAt: now,
      lastUpdatedAt: now,
    };
  }

  return {
    ...run,
    status: "timeout",
    scoreVsPar: TIMEOUT_PENALTY,
    scoreDisplay: `+${TIMEOUT_PENALTY}`,
    scoreLabel: "timeout",
    finishReason: reason,
    lockedAt: now,
    lastUpdatedAt: now,
  };
}

function getSessionDeadline(session) {
  if (!session?.holeStartedAt) {
    return null;
  }

  return session.holeStartedAt + session.timeLimitSeconds * 1000;
}

async function requireSupabase() {
  if (!supabase || !hasSupabaseConfig) {
    throw new Error("Supabase no esta configurado.");
  }

  await ensureSupabaseAnonymousSession();
}

async function fetchSessionRow(sessionId) {
  await requireSupabase();

  const { data, error } = await supabase
    .from("classroom_sessions")
    .select(CLASSROOM_SESSION_SELECT)
    .eq("id", sessionId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function fetchRunRow(sessionId, teamId, holeId) {
  await requireSupabase();

  const { data, error } = await supabase
    .from("classroom_team_runs")
    .select("*, classroom_prompt_turns(*)")
    .eq("session_id", sessionId)
    .eq("team_id", teamId)
    .eq("hole_id", holeId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function upsertRunRow(runPayload) {
  await requireSupabase();

  const { data, error } = await supabase
    .from("classroom_team_runs")
    .upsert(runPayload, { onConflict: "session_id,team_id,hole_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateRunFields(runId, payload) {
  await requireSupabase();

  const { error } = await supabase
    .from("classroom_team_runs")
    .update(payload)
    .eq("id", runId);

  if (error) {
    throw error;
  }
}

async function ensureRunForTeam(session, teamId, holeId) {
  const existingTeam = session.teams.find((team) => team.id === teamId);
  const existingRun = existingTeam?.holeRuns?.[holeId];

  if (existingRun) {
    return existingRun;
  }

  const created = await upsertRunRow({
    session_id: session.id,
    team_id: teamId,
    hole_id: holeId,
    model_id: session.modelId,
    prompt_seed: buildPromptSeed(getHoleById(holeId)),
    status: "pending",
    prompts_used: 0,
    completion: 0,
  });

  return mapRunRecord({ ...created, classroom_prompt_turns: [] });
}

export async function listRemoteSessions() {
  await requireSupabase();

  const { data, error } = await supabase
    .from("classroom_sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data.map((session) => ({
    id: session.id,
    name: session.name,
    phase: session.phase,
    trackId: session.track_id,
    modelId: session.model_id,
    teamsCount: session.teams_count ?? 0,
    activeHoleIndex: session.active_hole_index,
    holeIds: session.hole_ids ?? [],
    timeLimitSeconds: session.time_limit_seconds,
    revealMode: session.reveal_mode,
    holeStartedAt: session.hole_started_at ? new Date(session.hole_started_at).getTime() : null,
    createdAt: session.created_at,
  }));
}

export async function fetchRemoteSession(sessionId) {
  const data = await fetchSessionRow(sessionId);

  return mapSessionRecord(data);
}

export async function createRemoteSession({
  name,
  trackId,
  modelId,
  holeCount,
  timeLimitSeconds,
  revealMode,
}) {
  await requireSupabase();

  const track = getTrackById(trackId);
  const holeIds = track.holes.slice(0, holeCount).map((hole) => hole.id);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("classroom_sessions")
    .insert({
      name: name.trim() || `Session ${new Date().toLocaleTimeString()}`,
      track_id: track.id,
      model_id: modelId || getModelById(modelId)?.id,
      hole_ids: holeIds,
      time_limit_seconds: timeLimitSeconds,
      reveal_mode: revealMode,
      phase: "setup",
      active_hole_index: 0,
      created_by: user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function addRemoteTeam(sessionId, { name, members }) {
  await requireSupabase();

  const { data, error } = await supabase
    .from("classroom_teams")
    .insert({
      session_id: sessionId,
      name: name.trim() || `Team ${Math.floor(Math.random() * 100)}`,
      members: members.map((member) => member.trim()),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function removeRemoteTeam(sessionId, teamId) {
  await requireSupabase();

  const { error } = await supabase
    .from("classroom_teams")
    .delete()
    .eq("session_id", sessionId)
    .eq("id", teamId);

  if (error) {
    throw error;
  }
}

export async function launchRemoteHole(sessionId) {
  const session = await fetchRemoteSession(sessionId);
  const holeId = getCurrentHoleId(session);

  if (!holeId) {
    await requireSupabase();
    const { error } = await supabase
      .from("classroom_sessions")
      .update({ phase: "finished", hole_started_at: null })
      .eq("id", sessionId);

    if (error) {
      throw error;
    }

    return;
  }

  await Promise.all(
    session.teams.map((team) =>
      ensureRunForTeam(session, team.id, holeId)
    )
  );

  const now = new Date().toISOString();

  await requireSupabase();
  const { error } = await supabase
    .from("classroom_sessions")
    .update({
      phase: "live",
      hole_started_at: now,
    })
    .eq("id", sessionId);

  if (error) {
    throw error;
  }
}

export async function closeRemoteHole(sessionId, reason = "teacher") {
  const session = await fetchRemoteSession(sessionId);
  const holeId = getCurrentHoleId(session);

  if (!holeId) {
    return;
  }

  const hole = getHoleById(holeId);
  const now = new Date().toISOString();

  await Promise.all(
    session.teams.map(async (team) => {
      const ensuredRun = team.holeRuns[holeId] ?? (await ensureRunForTeam(session, team.id, holeId));
      const finalRun = finalizeRun(ensuredRun, hole, reason, now);
      const remoteRun = await fetchRunRow(session.id, team.id, holeId);

      await updateRunFields(remoteRun.id, {
        status: finalRun.status,
        prompts_used: finalRun.promptsUsed,
        completion: finalRun.completion ?? 0,
        score_vs_par: finalRun.scoreVsPar,
        score_display: finalRun.scoreDisplay,
        score_label: finalRun.scoreLabel,
        finish_reason: finalRun.finishReason,
        locked_at: finalRun.lockedAt,
        last_updated_at: finalRun.lastUpdatedAt,
      });
    })
  );

  await requireSupabase();
  const { error } = await supabase
    .from("classroom_sessions")
    .update({
      phase: "review",
    })
    .eq("id", sessionId);

  if (error) {
    throw error;
  }
}

export async function advanceRemoteHole(sessionId) {
  const session = await fetchRemoteSession(sessionId);
  const nextIndex = session.activeHoleIndex + 1;
  const finished = nextIndex >= session.holeIds.length;

  await requireSupabase();
  const { error } = await supabase
    .from("classroom_sessions")
    .update({
      active_hole_index: finished ? session.activeHoleIndex : nextIndex,
      phase: finished ? "finished" : "setup",
      hole_started_at: null,
    })
    .eq("id", sessionId);

  if (error) {
    throw error;
  }
}

export async function submitRemotePrompt(sessionId, teamId, prompt) {
  const session = await fetchRemoteSession(sessionId);
  const deadline = getSessionDeadline(session);

  if (session.phase !== "live") {
    return null;
  }

  if (deadline && Date.now() >= deadline) {
    await closeRemoteHole(sessionId, "timer");
    return null;
  }

  const holeId = getCurrentHoleId(session);
  const hole = getHoleById(holeId);
  const run = await ensureRunForTeam(session, teamId, holeId);
  const turn = simulatePromptTurn({
    hole,
    modelId: session.modelId,
    prompt: prompt.trim(),
    promptCount: run.turns.length + 1,
  });
  const now = new Date().toISOString();
  const remoteRun = await fetchRunRow(sessionId, teamId, holeId);
  const runId = remoteRun?.id ?? (await upsertRunRow({
    session_id: sessionId,
    team_id: teamId,
    hole_id: holeId,
    model_id: session.modelId,
    prompt_seed: buildPromptSeed(hole),
    status: "pending",
    prompts_used: 0,
    completion: 0,
  })).id;

  await requireSupabase();
  const { error: turnError } = await supabase
    .from("classroom_prompt_turns")
    .insert({
      run_id: runId,
      session_id: sessionId,
      team_id: teamId,
      prompt_count: turn.promptCount,
      prompt: turn.prompt,
      output: turn.output,
      evaluation: turn.evaluation,
      telemetry: turn.telemetry,
      created_at: now,
    });

  if (turnError) {
    throw turnError;
  }

  await updateRunFields(runId, {
    status: turn.evaluation.status === "valid" ? "ready" : "live",
    prompts_used: turn.promptCount,
    completion: turn.evaluation.completion,
    last_updated_at: now,
  });

  return turn;
}

export async function lockRemoteScore(sessionId, teamId) {
  const session = await fetchRemoteSession(sessionId);
  const holeId = getCurrentHoleId(session);
  const hole = getHoleById(holeId);
  const run = session.teams.find((team) => team.id === teamId)?.holeRuns?.[holeId];

  if (!run || run.turns.at(-1)?.evaluation?.status !== "valid") {
    return false;
  }

  const finalRun = finalizeRun(run, hole, "manual", new Date().toISOString());
  const remoteRun = await fetchRunRow(sessionId, teamId, holeId);

  await updateRunFields(remoteRun.id, {
    status: finalRun.status,
    prompts_used: finalRun.promptsUsed,
    completion: finalRun.completion,
    score_vs_par: finalRun.scoreVsPar,
    score_display: finalRun.scoreDisplay,
    score_label: finalRun.scoreLabel,
    finish_reason: finalRun.finishReason,
    locked_at: finalRun.lockedAt,
    last_updated_at: finalRun.lastUpdatedAt,
  });

  const refreshed = await fetchRemoteSession(sessionId);
  const currentHoleId = getCurrentHoleId(refreshed);
  const allClosed = refreshed.teams.every((team) => {
    const currentRun = team.holeRuns?.[currentHoleId];

    return currentRun && ["locked", "timeout"].includes(currentRun.status);
  });

  if (allClosed) {
    await requireSupabase();
    const { error } = await supabase
      .from("classroom_sessions")
      .update({ phase: "review" })
      .eq("id", sessionId);

    if (error) {
      throw error;
    }
  }

  return true;
}

export async function syncRemoteSessionTimers(sessionId) {
  const session = await fetchRemoteSession(sessionId);
  const deadline = getSessionDeadline(session);

  if (session.phase === "live" && deadline && Date.now() >= deadline) {
    await closeRemoteHole(sessionId, "timer");
    return await fetchRemoteSession(sessionId);
  }

  return session;
}

export function subscribeRemoteSessions(onChange) {
  if (!supabase) {
    return () => {};
  }

  const channel = supabase
    .channel("classroom-sessions-list")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "classroom_sessions" },
      async () => {
        onChange(await listRemoteSessions());
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeRemoteSession(sessionId, onChange) {
  if (!supabase || !sessionId) {
    return () => {};
  }

  const handler = async () => {
    onChange(await fetchRemoteSession(sessionId));
  };

  const channel = supabase
    .channel(`classroom-session-${sessionId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "classroom_sessions", filter: `id=eq.${sessionId}` },
      handler
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "classroom_teams", filter: `session_id=eq.${sessionId}` },
      handler
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "classroom_team_runs", filter: `session_id=eq.${sessionId}` },
      handler
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "classroom_prompt_turns", filter: `session_id=eq.${sessionId}` },
      handler
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function getSuggestedSessionConfig() {
  return {
    trackId: TRACKS[0].id,
    modelId: getModelById(TRACKS[0].holes[0]?.preferredModels?.[0] ?? "grid-01").id,
  };
}

export { hasSupabaseConfig };
