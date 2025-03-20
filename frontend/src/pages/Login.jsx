import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Limpa erros anteriores

    try {
      const API_URL = import.meta.env.VITE_API_URL || "https://trafficsystem-def333809a1f.herokuapp.com/api";
      console.log("🚀 API_URL no Login:", API_URL); // <-- Adicione esta linha aqui

      const response = await axios.post(`${API_URL}/login`, {
        username,
        password,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user || {}));
        console.log("Token salvo no Local Storage:", localStorage.getItem("token"));
        navigate("/traffic");
      } else {
        throw new Error("Token não recebido.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao fazer login.");
      console.error("Erro no login:", err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[90%] max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded mb-2"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            required
          />
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
