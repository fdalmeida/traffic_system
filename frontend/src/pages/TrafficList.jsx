import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaFilter, FaTimes, FaTrash, FaEdit } from "react-icons/fa";

const TrafficList = () => {
  const navigate = useNavigate();

  // -------------------- ESTADOS PRINCIPAIS --------------------
  const [traffic, setTraffic] = useState([]);
  const [filteredTraffic, setFilteredTraffic] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [userLevel, setUserLevel] = useState(null);

  // -------------------- SWIPE (apenas nível 1) --------------------
  const [swipedId, setSwipedId] = useState(null);
  const touchStartXRef = useRef(0);
  const touchDeltaXRef = useRef(0);
  const isSwipingRef = useRef(false);

  // -------------------- FILTROS --------------------
  const [filterAccount, setFilterAccount] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const todayISO = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(new Date(todayISO).getDate() + 15);
  const deliveryISO = futureDate.toISOString().split("T")[0];
  const [filterDeliveryDateFrom, setFilterDeliveryDateFrom] = useState(todayISO);
  const [filterDeliveryDateTo, setFilterDeliveryDateTo] = useState(deliveryISO);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // -------------------- DADOS AUXILIARES --------------------
  const [accounts, setAccounts] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // -------------------- MODAIS --------------------
  const [showTrafficModal, setShowTrafficModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // -------------------- EDIÇÃO --------------------
  const [editTraffic, setEditTraffic] = useState(null);

  // -------------------- CONTATOS --------------------
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [allContacts, setAllContacts] = useState([]);

  // -------------------- NOVO TRÁFEGO --------------------
  const today = new Date().toISOString().split("T")[0];
  const future = new Date();
  future.setDate(new Date(today).getDate() + 15);
  const futureDelivery = future.toISOString().split("T")[0];

  const [newTraffic, setNewTraffic] = useState({
    open_date: today,
    delivery_date: futureDelivery,
    subject: "",
    description: "",
    account_id: "",
    status_id: "",
  });

  // -------------------- FUNÇÕES DE DATA --------------------
  const formatDateToBR = (date) => {
    if (!date) return "Data inválida";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  // -------------------- FETCHS --------------------
  const fetchTraffic = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "https://trafficsystem-def333809a1f.herokuapp.com/api";
  
      console.log("🚀 API_URL no TrafficList:", import.meta.env.VITE_API_URL);
      console.log("🚀 Buscando tráfegos em:", `${API_URL}/traffic`);
  
      const response = await axios.get(`${API_URL}/traffic`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      console.log("📌 API Response:", response.data);
  
      setTraffic(Array.isArray(response.data) ? response.data : []);
      setFilteredTraffic(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("❌ Erro ao buscar tráfegos:", error.response?.data || error.message);
    }
  };
    

  const fetchUserLevel = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/user-level`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserLevel(response.data.level_id);
    } catch (error) {
      console.error("Erro ao buscar nível do usuário:", error.response?.data || error.message);
    }
  };

  const fetchAccountsAndStatuses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const [accRes, stsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/statuses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setAccounts(accRes.data || []);
      setStatuses(stsRes.data || []);
    } catch (error) {
      console.error("Erro ao buscar contas e status:", error);
    }
  };

  const fetchAllContacts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllContacts(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar contatos:", error);
    }
  };

  const fetchTrafficContacts = async (trafficId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/traffic/${trafficId}/contacts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const linkedContacts = response.data.linkedContactIds || [];
      const allContactsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts(allContactsRes.data || []);
      setSelectedContacts(linkedContacts);
    } catch (error) {
      console.error("Erro ao buscar contatos do tráfego:", error);
    }
  };

  // -------------------- FILTRO LOCAL --------------------
  const applyLocalFilters = () => {
    let result = [...traffic];

    // Filtra por conta
    if (filterAccount) {
      result = result.filter((t) => t.account_id === Number(filterAccount));
    }
    // Filtra por status
    if (filterStatus) {
      result = result.filter((t) => t.status_id === Number(filterStatus));
    }
    // Filtra por data de entrega (início)
    if (filterDeliveryDateFrom) {
      result = result.filter((t) => {
        const tDate = t.delivery_date.split("T")[0];
        return tDate >= filterDeliveryDateFrom;
      });
    }
    // Filtra por data de entrega (fim)
    if (filterDeliveryDateTo) {
      result = result.filter((t) => {
        const tDate = t.delivery_date.split("T")[0];
        return tDate <= filterDeliveryDateTo;
      });
    }

    setFilteredTraffic(result);

    // Define se o botão "Remover Filtro" aparece
    setHasActiveFilters(
      !!filterAccount ||
      !!filterStatus ||
      filterDeliveryDateFrom !== todayISO ||
      filterDeliveryDateTo !== deliveryISO
    );
  };

  const handleClearFilters = () => {
    setFilterAccount("");
    setFilterStatus("");
    setFilterDeliveryDateFrom(todayISO);
    setFilterDeliveryDateTo(deliveryISO);
    setFilteredTraffic([...traffic]);
    setHasActiveFilters(false);
  };

  // -------------------- CRIAÇÃO E EDIÇÃO DE TRÁFEGO --------------------
  const handleCreateTraffic = async () => {
    if (
      !newTraffic.subject ||
      !newTraffic.description ||
      !newTraffic.account_id ||
      !newTraffic.status_id
    ) {
      alert("Preencha todos os campos antes de salvar.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Usuário não autenticado. Faça login novamente.");
        return;
      }
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/traffic`,
        {
          subject: newTraffic.subject,
          description: newTraffic.description,
          account_id: Number(newTraffic.account_id),
          status_id: Number(newTraffic.status_id),
          open_date: newTraffic.open_date,
          delivery_date: newTraffic.delivery_date,
          contacts: selectedContacts,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status !== 201) {
        throw new Error("Erro ao salvar tráfego.");
      }
      fetchTraffic();
      setShowTrafficModal(false);
    } catch (error) {
      console.error("Erro ao criar tráfego:", error);
      alert("Erro ao criar tráfego. Tente novamente.");
    }
  };

  const openEditModal = async (trafficItem) => {
    setEditTraffic({ ...trafficItem });
    await fetchTrafficContacts(trafficItem.id);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editTraffic) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/traffic/${editTraffic.id}`,
        {
          delivery_date: editTraffic.delivery_date,
          account_id: editTraffic.account_id,
          status_id: editTraffic.status_id,
          contacts: selectedContacts,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false);
      fetchTraffic();
    } catch (error) {
      console.error("Erro ao salvar alterações do tráfego:", error);
    }
  };

  // -------------------- CANCELAMENTO DE TRÁFEGO --------------------
  const handleCancelTraffic = async (trafficId) => {
    if (!window.confirm("Tem certeza que deseja cancelar este tráfego?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Usuário não autenticado. Faça login novamente.");
        return;
      }
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/traffic/${trafficId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        alert("Tráfego cancelado com sucesso.");
        fetchTraffic();
      } else {
        alert("Erro ao cancelar tráfego. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao cancelar tráfego:", error);
      alert("Erro ao cancelar tráfego. Verifique o console.");
    }
  };

  // -------------------- CONTATOS (NOVA TAREFA/EDIÇÃO) --------------------
  const handleAddContact = () => {
    const foundContact = allContacts.find(
      (contact) =>
        contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        contact.email.toLowerCase().includes(contactSearch.toLowerCase())
    );
    if (foundContact) {
      if (!selectedContacts.includes(foundContact.id)) {
        setSelectedContacts((prev) => [...new Set([...prev, foundContact.id])]);
      }
      setContactSearch("");
    } else {
      alert("Contato não encontrado. Verifique os dados e tente novamente.");
    }
  };

  // -------------------- SWIPE: TOUCH + MOUSE --------------------
  const canSwipe = userLevel === 1;

  const handleTouchStart = (e, itemId) => {
    if (!canSwipe) return;
    if (swipedId && swipedId !== itemId) {
      setSwipedId(null);
    }
    touchStartXRef.current = e.touches[0].clientX;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!canSwipe) return;
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    touchDeltaXRef.current = deltaX;
    if (Math.abs(deltaX) > 10) {
      isSwipingRef.current = true;
    }
  };

  const handleTouchEnd = (itemId) => {
    if (!canSwipe) return;
    if (isSwipingRef.current) {
      if (touchDeltaXRef.current < -50) {
        setSwipedId(itemId);
      } else {
        setSwipedId(null);
      }
    }
    touchDeltaXRef.current = 0;
    isSwipingRef.current = false;
  };

  const handleMouseDown = (e, itemId) => {
    if (!canSwipe) return;
    if (swipedId && swipedId !== itemId) {
      setSwipedId(null);
    }
    touchStartXRef.current = e.clientX;
    isSwipingRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!canSwipe) return;
    if (e.buttons === 1) {
      const deltaX = e.clientX - touchStartXRef.current;
      touchDeltaXRef.current = deltaX;
      if (Math.abs(deltaX) > 10) {
        isSwipingRef.current = true;
      }
    }
  };

  const handleMouseUp = (itemId) => {
    if (!canSwipe) return;
    if (isSwipingRef.current) {
      if (touchDeltaXRef.current < -50) {
        setSwipedId(itemId);
      } else {
        setSwipedId(null);
      }
    }
    touchDeltaXRef.current = 0;
    isSwipingRef.current = false;
  };

  // -------------------- EFFECTS --------------------
  useEffect(() => {
    fetchTraffic();
    fetchUserLevel();
    fetchAccountsAndStatuses();
    fetchAllContacts();
  }, []);

  useEffect(() => {
    if (editTraffic && editTraffic.id) {
      fetchTrafficContacts(editTraffic.id);
    }
  }, [editTraffic]);

  // Fecha modais com ESC
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowEditModal(false);
        setShowTrafficModal(false);
        setShowFilters(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // -------------------- RENDER --------------------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Container centralizado para telas grandes */}
      <div className="max-w-md mx-auto w-full p-4">

        {/* Cabeçalho */}
        <div className="flex justify-between items-center bg-white shadow p-4 mb-4 rounded-lg">
          <h1 className="text-2xl font-bold">Tráfegos</h1>
          <button
            className="p-2 border rounded-md"
            onClick={() => {
              setShowFilters(true);
              setHasActiveFilters(
                !!filterAccount ||
                !!filterStatus ||
                filterDeliveryDateFrom !== todayISO ||
                filterDeliveryDateTo !== deliveryISO
              );
            }}
          >
            <FaFilter />
          </button>
        </div>

        {/* Lista de Tráfegos */}
        <div className="mb-24"> 
          {filteredTraffic.length > 0 ? (
            filteredTraffic.map((t, index) => {
              // Verifica se o tráfego está atrasado
              const isLate =
                new Date(t.delivery_date) < new Date(todayISO) &&
                t.status_id !== 2 &&
                t.status_id !== 5;
              const isSwiped = swipedId === t.id && canSwipe;

              // Alterna cor de fundo ou vermelho claro se atrasado
              let bgClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";
              if (isLate) {
                bgClass = "bg-red-100";
              }

              return (
                <div key={t.id} className="relative overflow-hidden rounded-lg shadow mb-4">
                  <div
                    className={`p-4 transition-transform duration-300 cursor-pointer ${bgClass}`}
                    style={{ transform: isSwiped ? "translateX(-50%)" : "translateX(0)" }}
                    onClick={() => {
                      if (!isSwipingRef.current) {
                        navigate(`/traffic/${t.id}`);
                      }
                    }}
                    onTouchStart={(e) => canSwipe && handleTouchStart(e, t.id)}
                    onTouchMove={(e) => canSwipe && handleTouchMove(e)}
                    onTouchEnd={() => canSwipe && handleTouchEnd(t.id)}
                    onMouseDown={(e) => canSwipe && handleMouseDown(e, t.id)}
                    onMouseMove={(e) => canSwipe && handleMouseMove(e)}
                    onMouseUp={() => canSwipe && handleMouseUp(t.id)}
                  >
                    <p><strong>Conta:</strong> {t.account_name}</p>
                    <p><strong>Data de Abertura:</strong> {formatDateToBR(t.open_date)}</p>
                    <p><strong>Data de Entrega:</strong> {formatDateToBR(t.delivery_date)}</p>
                    <p><strong>Assunto:</strong> {t.subject}</p>
                    <p>
                      <strong>Situação:</strong> {t.status_name}{" "}
                      {isLate && (
                        <span className="ml-2 px-1 py-0.5 text-red-600 bg-yellow-200 rounded">
                          Atrasado
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Botões de swipe (somente nível 1) */}
                  {canSwipe && (
                    <div
                      className="absolute top-0 right-0 h-full flex border-l border-gray-300 transition-all duration-300"
                      style={{ width: isSwiped ? "50%" : "0" }}
                    >
                      <button
                        className="w-1/2 bg-red-500 text-white flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelTraffic(t.id);
                        }}
                      >
                        <FaTrash size={20} />
                      </button>
                      <button
                        className="w-1/2 bg-blue-500 text-white flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(t);
                        }}
                      >
                        <FaEdit size={20} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">Nenhum tráfego encontrado.</p>
          )}
        </div>

        {/* Botão Novo (flutuante) – se userLevel=1 e não há modal aberto */}
        {!(showTrafficModal || showEditModal) && userLevel === 1 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow p-2 z-50">
            <div className="max-w-md mx-auto">
              <button
                className="w-full bg-blue-500 text-white py-2 rounded"
                onClick={() => setShowTrafficModal(true)}
              >
                Novo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE FILTROS */}
      {showFilters && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg relative w-[90%] max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFilters(false)}
              className="absolute top-2 right-2 text-gray-500"
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Filtrar Tráfegos</h2>
            <hr className="border-t border-gray-300 mb-4" />

            {/* Filtro por Conta */}
            <label className="block text-sm font-medium text-gray-400 mb-1">Conta</label>
            <select
              className="w-full p-2 border rounded mb-4"
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
            >
              <option value="">Todas as Contas</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name}
                </option>
              ))}
            </select>

            {/* Filtro por Status */}
            <label className="block text-sm font-medium text-gray-400 mb-1">Situação</label>
            <select
              className="w-full p-2 border rounded mb-4"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos os Status</option>
              {statuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.status_name}
                </option>
              ))}
            </select>

            {/* Filtro por Data de Entrega (De) */}
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Data de Entrega (De)
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded mb-4"
              value={filterDeliveryDateFrom}
              onChange={(e) => setFilterDeliveryDateFrom(e.target.value)}
            />

            {/* Filtro por Data de Entrega (Até) */}
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Data de Entrega (Até)
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded mb-4"
              value={filterDeliveryDateTo}
              onChange={(e) => setFilterDeliveryDateTo(e.target.value)}
            />

            <div className="flex gap-2">
              {hasActiveFilters && (
                <button
                  className="w-1/2 bg-red-500 text-white p-2 rounded"
                  onClick={() => {
                    handleClearFilters();
                    setShowFilters(false);
                  }}
                >
                  Remover Filtro
                </button>
              )}
              <button
                className="w-1/2 bg-blue-500 text-white p-2 rounded"
                onClick={() => {
                  applyLocalFilters();
                  setShowFilters(false);
                }}
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOVO TRÁFEGO */}
      {showTrafficModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setShowTrafficModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg relative w-[90%] max-w-md mx-auto max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={() => setShowTrafficModal(false)}
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Novo Tráfego</h2>

            <label className="block text-sm font-medium text-gray-400">Data de Abertura</label>
            <input
              type="date"
              className="w-full p-2 border rounded mb-2"
              value={newTraffic.open_date}
              onChange={(e) => setNewTraffic({ ...newTraffic, open_date: e.target.value })}
              autoFocus
            />

            <input
              className="w-full p-2 border rounded mb-2"
              placeholder="Em uma frase, qual é o assunto?"
              value={newTraffic.subject}
              onChange={(e) => setNewTraffic({ ...newTraffic, subject: e.target.value })}
            />

            <select
              className="w-full p-2 border rounded mb-2"
              value={newTraffic.account_id}
              onChange={(e) => setNewTraffic({ ...newTraffic, account_id: e.target.value })}
            >
              <option value="">Selecione a Conta</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name}
                </option>
              ))}
            </select>

            <select
              className="w-full p-2 border rounded mb-2"
              value={newTraffic.status_id}
              onChange={(e) => setNewTraffic({ ...newTraffic, status_id: e.target.value })}
            >
              <option value="">Selecione o Status</option>
              {statuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.status_name}
                </option>
              ))}
            </select>

            <textarea
              className="w-full p-2 border rounded mb-2"
              placeholder="Descreva com detalhes, o que precisa ser desenvolvido."
              value={newTraffic.description}
              onChange={(e) => setNewTraffic({ ...newTraffic, description: e.target.value })}
            />

            <label className="block text-sm font-medium text-gray-400">Contatos Envolvidos</label>
            <div className="w-full p-2 border rounded mb-2">
              {selectedContacts.length > 0 ? (
                selectedContacts.map((contactId) => {
                  const contact = allContacts.find((c) => c.id === contactId);
                  return contact ? (
                    <div
                      key={contact.id}
                      className="flex justify-between items-center bg-gray-100 px-2 py-1 rounded mb-1"
                    >
                      <span>
                        {contact.name} - {contact.email}
                      </span>
                      <button
                        className="text-red-500 font-bold"
                        onClick={() =>
                          setSelectedContacts(selectedContacts.filter((id) => id !== contactId))
                        }
                      >
                        ❌
                      </button>
                    </div>
                  ) : null;
                })
              ) : (
                <p className="text-gray-500">Nenhum contato adicionado.</p>
              )}
            </div>

            <label className="block text-sm font-medium text-gray-400">Adicionar Contatos</label>
            <div className="w-full p-2 border rounded mb-2 max-h-40 overflow-y-auto">
              {allContacts
                .filter((contact) => !selectedContacts.includes(contact.id))
                .map((contact) => (
                  <div
                    key={contact.id}
                    className="flex justify-between items-center bg-white hover:bg-gray-100 px-2 py-1 rounded mb-1 cursor-pointer"
                    onClick={() => setSelectedContacts([...selectedContacts, contact.id])}
                  >
                    <span>
                      {contact.name} - {contact.email}
                    </span>
                    <button className="text-green-500 font-bold">➕</button>
                  </div>
                ))}
            </div>

            <label className="block text-sm font-medium text-gray-400">Data de Entrega</label>
            <input
              type="date"
              className="w-full p-2 border rounded mb-2"
              value={newTraffic.delivery_date}
              onChange={(e) => setNewTraffic({ ...newTraffic, delivery_date: e.target.value })}
            />

            <div className="flex gap-2 mt-4">
              <button
                className="w-1/2 bg-green-500 text-white px-4 py-2 rounded text-center"
                onClick={handleCreateTraffic}
              >
                Salvar
              </button>
              <button
                className="w-1/2 bg-red-500 text-white px-4 py-2 rounded text-center"
                onClick={() => setShowTrafficModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {showEditModal && editTraffic && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg relative w-[90%] max-w-md mx-auto max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(false);
              }}
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Alterar Tráfego</h2>

            <label className="block text-sm font-medium text-gray-500">Data de Entrega</label>
            <input
              type="date"
              className="w-full p-2 border rounded mb-2"
              value={
                editTraffic.delivery_date
                  ? new Date(editTraffic.delivery_date).toLocaleDateString("fr-CA")
                  : ""
              }
              onChange={(e) => setEditTraffic({ ...editTraffic, delivery_date: e.target.value })}
            />

            <label className="block text-sm font-medium text-gray-500">Conta</label>
            <select
              className="w-full p-2 border rounded mb-2"
              value={editTraffic.account_id || ""}
              onChange={(e) => setEditTraffic({ ...editTraffic, account_id: e.target.value })}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-500">Status</label>
            <select
              className="w-full p-2 border rounded mb-2"
              value={editTraffic.status_id || ""}
              onChange={(e) => setEditTraffic({ ...editTraffic, status_id: e.target.value })}
            >
              {statuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.status_name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-500">Contatos Envolvidos</label>
            <div className="w-full p-2 border rounded mb-2">
              {selectedContacts.length > 0 ? (
                selectedContacts.map((contactId) => {
                  const contact = contacts.find((c) => c.id === contactId);
                  return contact ? (
                    <div
                      key={contact.id}
                      className="flex justify-between items-center bg-gray-100 px-2 py-1 rounded mb-1"
                    >
                      <span>
                        {contact.name} - {contact.email}
                      </span>
                      <button
                        className="text-red-500 font-bold"
                        onClick={() =>
                          setSelectedContacts(selectedContacts.filter((id) => id !== contactId))
                        }
                      >
                        ❌
                      </button>
                    </div>
                  ) : null;
                })
              ) : (
                <p className="text-gray-500">Nenhum contato adicionado.</p>
              )}
            </div>

            {/* Selecionar contatos adicionais */}
            <select
              multiple
              className="w-full p-2 border rounded mb-2"
              value={selectedContacts}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, (option) =>
                  Number(option.value)
                );
                setSelectedContacts([...new Set([...selectedContacts, ...values])]);
              }}
            >
              {contacts
                .filter((c) => !selectedContacts.includes(c.id))
                .map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} - {contact.email}
                  </option>
                ))}
            </select>

            <div className="flex gap-2 mt-4">
              <button
                className="w-1/2 bg-green-500 text-white px-4 py-2 rounded"
                onClick={handleSaveEdit}
              >
                Salvar
              </button>
              <button
                className="w-1/2 bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficList;
