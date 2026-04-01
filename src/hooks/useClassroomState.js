import { useEffect, useState } from "react";
import { loadClassroomState, subscribeClassroomState, syncClassroomTimers } from "../lib/classroomStore";

export function useClassroomState({ syncTimers = false } = {}) {
  const [state, setState] = useState(loadClassroomState);

  useEffect(() => subscribeClassroomState(setState), []);

  useEffect(() => {
    if (!syncTimers) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setState(syncClassroomTimers());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [syncTimers]);

  return state;
}
