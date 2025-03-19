import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import Login from "./pages/Login";
import TrafficList from "./pages/TrafficList";
import TrafficDetails from "./pages/TrafficDetails";
import RequireAuth from "./components/RequireAuth"; // Proteção de Rotas

const InactivityMonitor = () => {
  const navigate = useNavigate();
  let timeout;

  const resetTimer = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      console.log("⏳ Tempo de inatividade excedido. Redirecionando para o login...");
      localStorage.removeItem("token");
      navigate("/");
    }, 15 * 60 * 1000); // 15 minutos
  };

  useEffect(() => {
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keypress", resetTimer);
    resetTimer();
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keypress", resetTimer);
    };
  }, []);

  return null;
};

// 🔹 Interceptador de resposta do Axios para capturar tokens expirados
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      console.log("🔴 Token expirado. Redirecionando para login...");
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

function App() {
  return (
    <Router>
      <InactivityMonitor />
      <Routes>
        {/* Rota Pública: Login */}
        <Route path="/" element={<Login />} />

        {/* Rotas Protegidas */}
        <Route
          path="/traffic"
          element={
            <RequireAuth>
              <TrafficList />
            </RequireAuth>
          }
        />
        <Route
          path="/traffic/:id"
          element={
            <RequireAuth>
              <TrafficDetails />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
