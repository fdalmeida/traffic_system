import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTimes } from "react-icons/fa";

const TrafficDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [traffic, setTraffic] = useState(null);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [newFollowup, setNewFollowup] = useState({
    event_date: today,
    description: "",
    responsible_return: "",
  });

  const fetchTrafficDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("Token não encontrado. Redirecionando para login...");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/traffic/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Resposta da API (Tela 2):", response.data);

      if (response.data) {
        setTraffic(response.data.traffic || {});
        setFollowups(response.data.followups || []);
      }

      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar detalhes do tráfego:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
      setError("Erro ao carregar o tráfego. Tente novamente.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficDetails();
  }, [id, navigate]);

  const handleCreateFollowup = async () => {
    if (!newFollowup.description || !newFollowup.responsible_return) {
      alert("Preencha todos os campos antes de salvar.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Usuário não autenticado. Faça login novamente.");
        return;
      }

      console.log("📌 Enviando requisição para novo acompanhamento...");
      console.log("🟢 Tráfego ID:", id);
      console.log("🟢 Descrição:", newFollowup.description);
      console.log("🟢 Devolutiva:", newFollowup.responsible_return);

      const formattedDate = newFollowup.event_date 
        ? new Date(newFollowup.event_date).toISOString().split("T")[0]
        : null;
  
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/traffic/${id}/followup`,
        {
          description: newFollowup.description,
          responsible_return: newFollowup.responsible_return,
          event_date: formattedDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.status === 201) {
        setNewFollowup({ event_date: today, description: "", responsible_return: "" });
        setShowFollowupModal(false);
        setTimeout(fetchTrafficDetails, 500);
      } else {
        alert("Erro ao adicionar acompanhamento. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao adicionar acompanhamento:", error);
      alert("Erro ao adicionar acompanhamento. Verifique o console.");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-600 mt-6">Carregando...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-6">{error}</div>;
  }

  return (
    <div className="p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center bg-white shadow p-4 mb-4 rounded-lg">
        <h1 className="text-2xl font-bold">Detalhes</h1>
        <div>
          <button
            className="p-2 bg-red-500 text-white rounded-md ml-4"
            onClick={() => navigate("/traffic")}
          >
            Voltar
          </button>
        </div>
      </div>

      {/* Capa do Tráfego */}
      <div className="bg-white shadow p-4 mb-4 rounded-lg">
        <h2 className="text-xl font-bold">📂 Capa do Tráfego</h2>
        <p><strong>Conta:</strong> {traffic.account_name}</p>
        <p>
          <strong>Data de Abertura:</strong>{" "}
          {new Date(traffic.open_date).toLocaleDateString()}
        </p>
        <p>
          <strong>Data de Entrega:</strong>{" "}
          {new Date(traffic.delivery_date).toLocaleDateString()}
        </p>
        <p><strong>Assunto:</strong> {traffic.subject}</p>
        <p><strong>Resumo:</strong> {traffic.summary_description}</p>
        <p>
          <strong>Descrição Completa:</strong>{" "}
          <span style={{ whiteSpace: "pre-wrap" }}>{traffic.description}</span>
        </p>
        <p><strong>Cliente:</strong> {traffic.client_name || "Não informado"}</p>
        <p><strong>Responsável:</strong> {traffic.responsible_name}</p>
        <p><strong>Situação:</strong> {traffic.status_name}</p>
      </div>

      {/* Acompanhamentos */}
      <h2 className="text-xl font-bold mt-6">📌 Acompanhamentos</h2>
      {followups.length > 0 ? (
        followups.map((followup, index) => (
          <div
            key={followup.id}
            className={`p-3 rounded-lg mb-2 shadow transition duration-200 hover:shadow-md ${
              index % 2 === 0 ? "bg-gray-100" : "bg-white"
            }`}
          >
            <p><strong>Data:</strong> {new Date(followup.event_date).toLocaleDateString()}</p>
            <p><strong>Descrição:</strong> {followup.description}</p>
            <p><strong>Devolutiva:</strong> {followup.responsible_return}</p>
          </div>
        ))
      ) : (
        <p className="text-gray-500">Nenhum acompanhamento encontrado.</p>
      )}

      {/* Modal de Novo Acompanhamento */}
      {showFollowupModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setShowFollowupModal(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg relative w-[90%] max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={() => setShowFollowupModal(false)}
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold mb-4">Novo Acompanhamento</h2>

            <label className="block text-sm font-medium text-gray-500">Data do Evento</label>
            <input 
              type="date" 
              className="w-full p-2 border rounded mb-2"
              value={newFollowup.event_date ? new Date(newFollowup.event_date).toISOString().split("T")[0] : ""}
              onChange={(e) =>
                setNewFollowup({ ...newFollowup, event_date: e.target.value })
              }
            />

            <label className="block text-sm font-medium text-gray-500">Descrição</label>
            <textarea 
              className="w-full p-2 border rounded mb-2" 
              placeholder="Descrição detalhada"
              value={newFollowup.description}
              onChange={(e) =>
                setNewFollowup({ ...newFollowup, description: e.target.value })
              }
            />

            <label className="block text-sm font-medium text-gray-500">Devolutiva do Responsável</label>
            <input 
              className="w-full p-2 border rounded mb-2" 
              placeholder="O que o responsável retornou?"
              value={newFollowup.responsible_return}
              onChange={(e) =>
                setNewFollowup({ ...newFollowup, responsible_return: e.target.value })
              }
            />

            <div className="flex gap-2">
              <button
                className="w-1/2 bg-green-500 text-white px-4 py-2 rounded text-center"
                onClick={handleCreateFollowup}
              >
                Salvar
              </button>
              <button
                className="w-1/2 bg-red-500 text-white px-4 py-2 rounded text-center"
                onClick={() => setShowFollowupModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé Flutuante: Apenas o botão "Novo" */}
      {!(showFollowupModal) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-t p-2 z-50">
          <div className="max-w-md mx-auto">
            <button
              className="w-full bg-blue-500 text-white py-2 rounded"
              onClick={() => setShowFollowupModal(true)}
            >
              Novo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficDetails;