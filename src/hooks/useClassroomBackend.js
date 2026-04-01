import { useEffect, useMemo, useState } from "react";
import { getActiveClassroomSession, loadClassroomState, subscribeClassroomState, syncClassroomTimers } from "../lib/classroomStore";
import {
  fetchRemoteSession,
  hasSupabaseConfig,
  listRemoteSessions,
  subscribeRemoteSession,
  subscribeRemoteSessions,
  syncRemoteSessionTimers,
} from "../lib/classroomSupabase";
import { ensureSupabaseAnonymousSession } from "../lib/supabaseClient";

export function useClassroomHub(selectedSessionId) {
  const [localState, setLocalState] = useState(loadClassroomState);
  const [remoteSessions, setRemoteSessions] = useState([]);
  const [remoteSession, setRemoteSession] = useState(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [remoteAvailable, setRemoteAvailable] = useState(hasSupabaseConfig);
  const mode = hasSupabaseConfig && remoteAvailable ? "supabase" : "local";

  useEffect(() => {
    if (!hasSupabaseConfig || !remoteAvailable) {
      const unsubscribe = subscribeClassroomState((nextState) => {
        setLocalState(nextState);
      });
      const intervalId = window.setInterval(() => {
        setLocalState(syncClassroomTimers());
      }, 1000);

      return () => {
        unsubscribe();
        window.clearInterval(intervalId);
      };
    }

    let cancelled = false;
    let unsubscribeList = () => {};

    async function boot() {
      setLoading(true);
      await ensureSupabaseAnonymousSession();
      const sessions = await listRemoteSessions();

      if (cancelled) {
        return;
      }

      setRemoteAvailable(true);
      setRemoteSessions(sessions);
      setLoading(false);

      unsubscribeList = subscribeRemoteSessions(async (nextSessions) => {
        setRemoteSessions(nextSessions);
      });
    }

    boot().catch(() => {
      if (!cancelled) {
        setRemoteAvailable(false);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribeList();
    };
  }, [remoteAvailable]);

  useEffect(() => {
    if (!hasSupabaseConfig || !remoteAvailable || !selectedSessionId) {
      return undefined;
    }

    let cancelled = false;
    let unsubscribe = () => {};

    async function bootSelectedSession() {
      const session = await fetchRemoteSession(selectedSessionId);

      if (cancelled) {
        return;
      }

      setRemoteSession(session);
      unsubscribe = subscribeRemoteSession(selectedSessionId, async (nextSession) => {
        setRemoteSession(nextSession);
      });
    }

    bootSelectedSession().catch(() => {
      if (!cancelled) {
        setRemoteAvailable(false);
      }
    });

    const intervalId = window.setInterval(async () => {
      if (cancelled) {
        return;
      }

      try {
        const session = await syncRemoteSessionTimers(selectedSessionId);
        setRemoteSession(session);
      } catch (error) {
        setRemoteAvailable(false);
      }
    }, 1000);

    return () => {
      cancelled = true;
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, [selectedSessionId, remoteAvailable]);

  const activeLocalSession = useMemo(() => {
    if (!selectedSessionId) {
      return getActiveClassroomSession(localState);
    }

    return localState.sessions?.[selectedSessionId] ?? null;
  }, [localState, selectedSessionId]);

  return {
    mode,
    loading,
    sessions: mode === "supabase" ? remoteSessions : Object.values(localState.sessions ?? {}),
    activeSession: mode === "supabase" ? remoteSession : activeLocalSession,
  };
}

export const useClassroomBackend = useClassroomHub;

export function useSingleClassroomSession(sessionId) {
  const { mode, loading, activeSession } = useClassroomHub(sessionId);

  return {
    mode,
    loading,
    session: activeSession,
  };
}
