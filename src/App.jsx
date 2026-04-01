import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import PromptGolfLanding from "./pages/PromptGolfLanding";
import PromptGolfArcade from "./pages/PromptGolfArcade";
import PromptGolfClassroom from "./pages/PromptGolfClassroom";
import PromptGolfClassroomTeam from "./pages/PromptGolfClassroomTeam";
import PromptGolfClassroomBroadcast from "./pages/PromptGolfClassroomBroadcast";
import AcademyLanding from "./pages/AcademyLanding";
import AcademyResources from "./pages/AcademyResources";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const id = location.hash.slice(1);
    const element = document.getElementById(id);

    if (element) {
      window.requestAnimationFrame(() => {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<PromptGolfLanding />} />
      <Route path="/play" element={<PromptGolfArcade />} />
      <Route path="/classroom" element={<PromptGolfClassroom />} />
      <Route path="/classroom/team" element={<PromptGolfClassroomTeam />} />
      <Route path="/classroom/broadcast" element={<PromptGolfClassroomBroadcast />} />
      <Route path="/fundamentos-ia" element={<AcademyLanding />} />
      <Route path="/fundamentos-ia/recursos" element={<AcademyResources />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
