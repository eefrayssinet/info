import { useEffect } from "react";

export function useBodyMode(mode, pageClass) {
  useEffect(() => {
    const previousMode = document.body.dataset.mode;
    const previousClassList = Array.from(document.body.classList);

    if (mode) {
      document.body.dataset.mode = mode;
    }

    document.body.className = previousClassList
      .filter((className) => !className.startsWith("page-"))
      .concat(pageClass ? [pageClass] : [])
      .join(" ");

    return () => {
      if (previousMode) {
        document.body.dataset.mode = previousMode;
      } else {
        delete document.body.dataset.mode;
      }

      document.body.className = previousClassList.join(" ");
    };
  }, [mode, pageClass]);
}
