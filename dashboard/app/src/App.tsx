import { Navigate, Route, Routes } from "react-router-dom";
import Shell from "@/components/layout/Shell";
import ExecutiveTriage from "@/components/page1/ExecutiveTriage";
import AgencyBenchmark from "@/components/page2/AgencyBenchmark";
import EquityLens from "@/components/page3/EquityLens";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/triage" replace />} />
        <Route path="/triage" element={<ExecutiveTriage />} />
        <Route path="/agency" element={<AgencyBenchmark />} />
        <Route path="/equity" element={<EquityLens />} />
        <Route path="*" element={<Navigate to="/triage" replace />} />
      </Routes>
    </Shell>
  );
}
