import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CreateProposal } from "./pages/CreateProposal";
import { Bet } from "./pages/Bet";
import { Execute } from "./pages/Execute";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/create" replace />} />
          <Route path="/create" element={<CreateProposal />} />
          <Route path="/bet" element={<Bet />} />
          <Route path="/execute" element={<Execute />} />
          <Route path="*" element={<Navigate to="/create" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}