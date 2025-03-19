import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaFilter, FaTimes, FaTrash, FaEdit } from "react-icons/fa";

/*
===========================================================
              TRAFFIC LIST - VERSÃO COMPLETA
===========================================================
Inclui:
- Listagem de tráfegos com swipe (para nível 1) que revela botões.
- Filtro local (por conta, status e intervalo de data de entrega).
- Modal de criação e edição de tráfegos.
- Gerenciamento de contatos.
- Botão "Novo" fixo no rodapé da tela e assinatura.
===========================================================
*/

const TrafficList = () => {
  const navigate = useNavigate();

  // ================== ESTADOS PRINCIPAIS ==================
  const [traffic, setTraffic] = useState([]);
  const [filteredTraffic, setFilteredTraffic] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [userLevel, setUserLevel] = useState(null);

  // ================== ESTADOS DE SWIPE (somente para nível 1) ==================
  const [swipedId, setSwipedId] = useState(null);
  const touchStartXRef = useRef(0);
  const touchDeltaXRef = useRef(0);
  const isSwipingRef = useRef(false);

  // ================== ESTADOS DOS FILTROS ==================
  // Filtro por Conta e Status
  const [filterAccount, setFilterAccount] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  // Filtro por Data de Entrega: intervalo "De" e "Até"
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(new Date(today).getDate() + 15);
  const delivery = futureDate.toISOString().split("T")[0];
  const [filterDeliveryDateFrom, setFilterDeliveryDateFrom] = useState(today);
  const [filterDeliveryDateTo, setFilterDeliveryDateTo] = useState(delivery);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // ================== DADOS AUXILIARES ==================
  const [accounts, setAccounts] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // ================== MODAIS ==================
  const [showTrafficModal, setShowTrafficModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // ================== EDIÇÃO ==================
  const [editTraffic, setEditTraffic] = useState(null);

  // ================== CONTATOS ==================
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [allContacts, setAllContacts] = useState([]);

  // ================== NOVO TRÁFEGO ==================
  const [newTraffic, setNewTraffic] = useState({
    open_date: today,
    delivery_date: delivery,
    subject: "",
    description: "",
    account_id: "",
    status_id: "",
  });

  // ================== FUNÇÕES DE DATA ==================
  const formatDateToBR = (date) => {
    if (!date) return "Data inválida";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatDateToISO = (date) => date.split("/").reverse().join("-");

  // ================== FETCHS ==================
  const fetchTraffic = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await axios.get("http://localhost:5050/api/traffic", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTraffic(response.data || []);
      setFilteredTraffic(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar tráfegos:", error.response?.data || error.message);
    }
  };

  const fetchUserLevel = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await axios.get("http://localhost:5050/api/user-level", {
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
        axios.get("http://localhost:5050/api/accounts", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5050/api/statuses", {
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
      const response = await axios.get("http://localhost:5050/api/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllContacts(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar todos os contatos:", error);
    }
  };

  const fetchTrafficContacts = async (trafficId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(
        `http://localhost:5050/api/traffic/${trafficId}/contacts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const linkedContacts = response.data.linkedContactIds || [];
      const allContactsRes = await axios.get("http://localhost:5050/api/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts(allContactsRes.data || []);
      setSelectedContacts(linkedContacts);
    } catch (error) {
      console.error("Erro ao buscar contatos do tráfego:", error);
    }
  };

  // ================== FUNÇÕES DE FILTRO LOCAL ==================
  const applyLocalFilters = () => {
    let result = [...traffic];

    if (filterAccount) {
      result = result.filter((t) => t.account_id === Number(filterAccount));
    }
    if (filterStatus) {
      result = result.filter((t) => t.status_id === Number(filterStatus));
    }
    if (filterDeliveryDateFrom) {
      result = result.filter((t) => {
        const tDate = t.delivery_date.split("T")[0];
        return tDate >= filterDeliveryDateFrom;
      });
    }
    if (filterDeliveryDateTo) {
      result = result.filter((t) => {
        const tDate = t.delivery_date.split("T")[0];
        return tDate <= filterDeliveryDateTo;
      });
    }

    setFilteredTraffic(result);
    setHasActiveFilters(!!filterAccount || !!filterStatus || !!filterDeliveryDateFrom || !!filterDeliveryDateTo);
  };

  const handleClearFilters = () => {
    setFilterAccount("");
    setFilterStatus("");
    setFilterDeliveryDateFrom(today);
    setFilterDeliveryDateTo(delivery);
    setFilteredTraffic([...traffic]);
    setHasActiveFilters(false);
  };

  // ================== CRIAÇÃO E EDIÇÃO ==================
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
        "http://localhost:5050/api/traffic",
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
        `http://localhost:5050/api/traffic/${editTraffic.id}`,
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

  // ================== CONTATOS ==================
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

  // ================== SWIPE LÓGICA (TOUCH e MOUSE) ==================
  // Só se aplica para usuários de nível 1
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

  // ================== EFFECTS ==================
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

  // ================== RENDER ==================
  return (
    <div className="p-6 overflow-x-hidden">
      {/* Cabeçalho (sem botão "Novo") */}
      <div className="flex justify-between items-center bg-white shadow p-4 mb-4 rounded-lg">
        <h1 className="text-2xl font-bold">Tráfegos</h1>
        <div className="flex gap-4">
          <button
            className="p-2 border rounded-md"
            onClick={() => {
              setShowFilters(true);
              setHasActiveFilters(
                !!filterAccount || !!filterStatus || !!filterDeliveryDateFrom || !!filterDeliveryDateTo
              );
            }}
          >
            <FaFilter />
          </button>
        </div>
      </div>

      {/* Lista de Tráfegos */}
      <div>
        {filteredTraffic.length > 0 ? (
          filteredTraffic.map((t, index) => {
            const isSwiped = swipedId === t.id && canSwipe;
            return (
              <div key={t.id} className="relative w-full max-w-md mx-auto overflow-hidden mb-4">
                {/* Card: Conteúdo que desliza */}
                <div
                  className={`p-4 rounded-lg shadow-md cursor-pointer transition-transform duration-300 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                  style={{
                    transform: isSwiped ? "translateX(-50%)" : "translateX(0)",
                  }}
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
                  <p>
                    <strong>Conta:</strong> {t.account_name}
                  </p>
                  <p>
                    <strong>Data de Abertura:</strong> {formatDateToBR(t.open_date)}
                  </p>
                  <p>
                    <strong>Data de Entrega:</strong> {formatDateToBR(t.delivery_date)}
                  </p>
                  <p>
                    <strong>Assunto:</strong> {t.subject}
                  </p>
                  <p>
                    <strong>Situação:</strong> {t.status_name}
                  </p>
                </div>

                {/* Botões de swipe (somente para nível 1) */}
                {canSwipe && (
                  <div
                    className="absolute top-0 right-0 h-full flex border-l border-gray-300 transition-all duration-300"
                    style={{
                      width: isSwiped ? "50%" : "0",
                    }}
                  >
                    <button
                      className="w-1/2 bg-red-500 text-white flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Excluir", t.id);
                        // Lógica de exclusão aqui
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

      {/* Rodapé flutuante: Botão "Novo" e Assinatura */}
      {!(showTrafficModal || showEditModal) && userLevel === 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-t p-4 z-50">
          <div className="max-w-md mx-auto">
            <button
              className="w-full bg-blue-500 text-white py-2 rounded"
              onClick={() => setShowTrafficModal(true)}
            >
              Novo
            </button>
            <hr className="my-4 border-gray-300" />
            <div className="text-center text-gray-500 text-sm">
              <p>
                Para saber mais, acesse converse diretamente com o pessoal do Marketing ou da Agência macrobrasil.com.
              </p>
              <hr className="my-2 border-gray-300" />
              <p className="italic text-gray-400">
                Sistema de Tráfego | Agência macrobrasil.com | Felipe Almeida &amp; J.A.R.V.I.S | xFA | Versão Beta, 19 de março de 2025.
              </p>
            </div>
          </div>
        </div>
      )}

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
            <h2 className="text-xl font-bold mb-4">Filtrar Tráfegos</h2>
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
            <label className="block text-sm font-medium text-gray-400 mb-1">Data de Entrega (De)</label>
            <input
              type="date"
              className="w-full p-2 border rounded mb-4"
              value={filterDeliveryDateFrom}
              onChange={(e) => setFilterDeliveryDateFrom(e.target.value)}
            />

            {/* Filtro por Data de Entrega (Até) */}
            <label className="block text-sm font-medium text-gray-400 mb-1">Data de Entrega (Até)</label>
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
          onClick={(e) => {
            e.stopPropagation();
            setShowTrafficModal(false);
          }}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg relative w-[90%] max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                setShowTrafficModal(false);
              }}
            >
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold mb-4">Novo Tráfego</h2>

            <label className="block text-sm font-medium text-gray-400">Data de Abertura</label>
            <input
              type="date"
              className="w-full p-2 border rounded mb-2"
              value={newTraffic.open_date}
              onChange={(e) =>
                setNewTraffic({ ...newTraffic, open_date: e.target.value })
              }
              autoFocus
            />

            <input
              className="w-full p-2 border rounded mb-2"
              placeholder="Em uma frase, qual é o assunto?"
              value={newTraffic.subject}
              onChange={(e) =>
                setNewTraffic({ ...newTraffic, subject: e.target.value })
              }
            />

            <select
              className="w-full p-2 border rounded mb-2"
              value={newTraffic.account_id}
              onChange={(e) =>
                setNewTraffic({ ...newTraffic, account_id: e.target.value })
              }
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
              onChange={(e) =>
                setNewTraffic({ ...newTraffic, status_id: e.target.value })
              }
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
              onChange={(e) =>
                setNewTraffic({ ...newTraffic, description: e.target.value })
              }
            />

            <label className="block text-sm font-medium text-gray-400">
              Contatos Envolvidos
            </label>
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
                          setSelectedContacts(
                            selectedContacts.filter((id) => id !== contactId)
                          )
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

            <label className="block text-sm font-medium text-gray-400">
              Adicionar Contatos
            </label>
            <div className="w-full p-2 border rounded mb-2 max-h-40 overflow-y-auto">
              {allContacts
                .filter((contact) => !selectedContacts.includes(contact.id))
                .map((contact) => (
                  <div
                    key={contact.id}
                    className="flex justify-between items-center bg-white hover:bg-gray-100 px-2 py-1 rounded mb-1 cursor-pointer"
                    onClick={() =>
                      setSelectedContacts([...selectedContacts, contact.id])
                    }
                  >
                    <span>
                      {contact.name} - {contact.email}
                    </span>
                    <button className="text-green-500 font-bold">➕</button>
                  </div>
                ))}
            </div>

            <label className="block text-sm font-medium text-gray-400">
              Data de Entrega
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded mb-2"
              value={newTraffic.delivery_date}
              onChange={(e) =>
                setNewTraffic({ ...newTraffic, delivery_date: e.target.value })
              }
            />

            <div className="flex gap-2">
              <button
                className="w-1/2 bg-green-500 text-white px-4 py-2 rounded text-center"
                onClick={handleCreateTraffic}
              >
                Salvar
              </button>
              <button
                className="w-1/2 bg-red-500 text-white px-4 py-2 rounded text-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTrafficModal(false);
                }}
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
            className="bg-white p-6 rounded-lg shadow-lg relative w-[90%] max-w-md mx-auto"
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
            <h2 className="text-xl font-bold mb-4">Alterar Tráfego</h2>

            <label>Data de Entrega</label>
            <input
              type="date"
              className="w-full p-2 border rounded mb-2"
              value={
                editTraffic.delivery_date
                  ? new Date(editTraffic.delivery_date).toLocaleDateString("fr-CA")
                  : ""
              }
              onChange={(e) =>
                setEditTraffic({ ...editTraffic, delivery_date: e.target.value })
              }
            />

            <label>Conta</label>
            <select
              className="w-full p-2 border rounded mb-2"
              value={editTraffic.account_id || ""}
              onChange={(e) =>
                setEditTraffic({ ...editTraffic, account_id: e.target.value })
              }
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name}
                </option>
              ))}
            </select>

            <label>Status</label>
            <select
              className="w-full p-2 border rounded mb-2"
              value={editTraffic.status_id || ""}
              onChange={(e) =>
                setEditTraffic({ ...editTraffic, status_id: e.target.value })
              }
            >
              {statuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.status_name}
                </option>
              ))}
            </select>

            <label>Contatos Envolvidos</label>
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

            <div className="flex gap-2">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={handleSaveEdit}
              >
                Salvar
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
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
