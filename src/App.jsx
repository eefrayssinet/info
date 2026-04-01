import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import PromptGolfLanding from "./pages/PromptGolfLanding";
import AcademyLanding from "./pages/AcademyLanding";
import AcademyResources from "./pages/AcademyResources";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
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
      <Route path="/fundamentos-ia" element={<AcademyLanding />} />
      <Route path="/fundamentos-ia/recursos" element={<AcademyResources />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
