import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaFilter, FaTimes, FaTrash, FaEdit } from "react-icons/fa";

const TrafficList = () => {
  const [traffic, setTraffic] = useState([]);
  const [filteredTraffic, setFilteredTraffic] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [userLevel, setUserLevel] = useState(null);
  const [swipedId, setSwipedId] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const todayISO = new Date().toISOString().split("T")[0];
  const getDateMinus30Days = () => {
    const today = new Date();
    today.setDate(today.getDate() - 30);
    return today.toISOString().split("T")[0];
  };
  const startISO = getDateMinus30Days();
  const [startDate, setStartDate] = useState(startISO);
  const [endDate, setEndDate] = useState(todayISO);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [showTrafficModal, setShowTrafficModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTraffic, setEditTraffic] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(new Date(today).getDate() + 15);
  const delivery = futureDate.toISOString().split("T")[0];
  const [allContacts, setAllContacts] = useState([]);
  const [newTraffic, setNewTraffic] = useState({
    open_date: today,
    delivery_date: delivery,
    subject: "",
    description: "",
    account_id: "",
    status_id: "",
  });
  const navigate = useNavigate();

  // Funções de conversão de data
  const formatDateToBR = (date) => {
    if (!date) return "Data inválida";
    return new Date(date).toLocaleDateString("pt-BR");
  };
  const formatDateToISO = (date) => date.split("/").reverse().join("-");

  const fetchTrafficContacts = async (trafficId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get(`http://localhost:5050/api/traffic/${trafficId}/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const linkedContacts = response.data.linkedContactIds || [];
      const allContactsRes = await axios.get("http://localhost:5050/api/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allContactsData = allContactsRes.data || [];
      setSelectedContacts(linkedContacts);
      setContacts(allContactsData);
    } catch (error) {
      console.error("Erro ao buscar contatos do tráfego:", error);
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

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await axios.put(`http://localhost:5050/api/traffic/${editTraffic.id}`, {
        delivery_date: editTraffic.delivery_date,
        account_id: editTraffic.account_id,
        status_id: editTraffic.status_id,
        contacts: selectedContacts,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowEditModal(false);
      fetchTraffic();
    } catch (error) {
      console.error("Erro ao salvar alterações do tráfego:", error);
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
      const [accountsRes, statusesRes] = await Promise.all([
        axios.get("http://localhost:5050/api/accounts", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5050/api/statuses", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setAccounts(accountsRes.data || []);
      setStatuses(statusesRes.data || []);
    } catch (error) {
      console.error("Erro ao buscar contas e status:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...traffic];
    const startISO = startDate ? formatDateToISO(startDate) : null;
    const endISO = endDate ? formatDateToISO(endDate) : null;
    filtered = filtered.filter((t) => {
      const matchAccount = selectedAccount ? t.account_id === Number(selectedAccount) : true;
      const matchStatus = selectedStatus ? t.status_id === Number(selectedStatus) : true;
      const deliveryDateISO = t.delivery_date.split("T")[0];
      const matchDateRange = (!startISO || deliveryDateISO >= startISO) && (!endISO || deliveryDateISO <= endISO);
      return matchAccount && matchStatus && matchDateRange;
    });
    setFilteredTraffic(filtered);
    setShowFilters(false);
  };

  const handleCreateTraffic = async () => {
    if (!newTraffic.subject || !newTraffic.description || !newTraffic.account_id || !newTraffic.status_id) {
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

  const handleAddContact = () => {
    const foundContact = allContacts.find((contact) =>
      contact.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      contact.email.toLowerCase().includes(contactSearch.toLowerCase())
    );
    if (foundContact) {
      if (!selectedContacts.includes(foundContact.id)) {
        setSelectedContacts((prevContacts) => [...new Set([...prevContacts, foundContact.id])]);
      }
      setContactSearch("");
    } else {
      alert("Contato não encontrado. Verifique os dados e tente novamente.");
    }
  };

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center bg-white shadow p-4 mb-4 rounded-lg">
        <h1 className="text-2xl font-bold">Tráfegos</h1>
        <div className="flex gap-4">
          <button
            className="p-2 border rounded-md"
            onClick={() => {
              setHasActiveFilters(
                selectedAccount !== "" ||
                  selectedStatus !== "" ||
                  startDate !== startISO ||
                  endDate !== todayISO
              );
              setShowFilters(true);
            }}
          >
            <FaFilter />
          </button>
          {userLevel === 1 && (
            <button
              className="p-2 bg-blue-500 text-white rounded-md"
              onClick={() => setShowTrafficModal(true)}
            >
              Novo
            </button>
          )}
        </div>
      </div>

      <div>
        {filteredTraffic.length > 0 ? (
          filteredTraffic.map((t) => (
            <React.Fragment key={t.id}>
              <div
                className="relative w-full max-w-md mx-auto bg-white shadow-md rounded-lg p-4 mb-4 cursor-pointer transition-transform duration-300"
                onClick={() => navigate(`/traffic/${t.id}`)}
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
              <div
                className={`absolute top-0 right-0 h-full flex transition-transform duration-300 ${
                  swipedId === t.id
                    ? "translate-x-0 opacity-100"
                    : "translate-x-full opacity-0"
                }`}
              >
                <button
                  className="w-12 bg-red-500 text-white flex items-center justify-center rounded-l-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Excluir", t.id);
                  }}
                >
                  <FaTrash size={20} />
                </button>
                <button
                  className="w-12 bg-blue-500 text-white flex items-center justify-center rounded-r-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(t);
                  }}
                >
                  <FaEdit size={20} />
                </button>
              </div>
            </React.Fragment>
          ))
        ) : (
          <p className="text-gray-500">Nenhum tráfego encontrado.</p>
        )}
      </div>

      {/* Modal de filtros */}
      {showFilters && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg relative w-[90%] max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowFilters(false)} className="absolute top-2 right-2 text-gray-500">
              <FaTimes />
            </button>
            <h2 className="text-xl font-bold mb-4">Filtrar Tráfego</h2>
            <hr className="border-t border-gray-300 mb-4" />
            <div className="flex gap-2 mb-4">
              <input
                type="date"
                className="w-1/2 p-2 border rounded"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="w-1/2 p-2 border rounded"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button onClick={applyFilters} className="w-full bg-blue-500 text-white px-4 py-2 rounded text-center">
              Filtrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de novo tráfego */}
      {showTrafficModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
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
            {/* Conteúdo do modal para novo tráfego */}
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
                    <div key={contact.id} className="flex justify-between items-center bg-gray-100 px-2 py-1 rounded mb-1">
                      <span>
                        {contact.name} - {contact.email}
                      </span>
                      <button
                        className="text-red-500 font-bold"
                        onClick={() => setSelectedContacts(selectedContacts.filter((id) => id !== contactId))}
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
            <div className="flex gap-2">
              <button className="w-1/2 bg-green-500 text-white px-4 py-2 rounded text-center" onClick={handleCreateTraffic}>
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

      {/* Modal de edição */}
      {showEditModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setShowEditModal(false)}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg relative w-[90%] max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Alterar Tráfego</h2>
            <label>Data de Entrega</label>
            <input
              type="date"
              className="w-full p-2 border rounded mb-2"
              value={editTraffic && editTraffic.delivery_date ? new Date(editTraffic.delivery_date).toLocaleDateString("fr-CA") : ""}
              onChange={(e) => setEditTraffic({ ...editTraffic, delivery_date: e.target.value })}
            />
            <label>Conta</label>
            <select
              className="w-full p-2 border rounded mb-2"
              value={editTraffic ? editTraffic.account_id : ""}
              onChange={(e) => setEditTraffic({ ...editTraffic, account_id: e.target.value })}
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
              value={editTraffic ? editTraffic.status_id : ""}
              onChange={(e) => setEditTraffic({ ...editTraffic, status_id: e.target.value })}
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
                    <div key={contact.id} className="flex justify-between items-center bg-gray-100 px-2 py-1 rounded mb-1">
                      <span>
                        {contact.name} - {contact.email}
                      </span>
                      <button className="text-red-500 font-bold" onClick={() => setSelectedContacts(selectedContacts.filter((id) => id !== contactId))}>
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
                const values = Array.from(e.target.selectedOptions, (option) => Number(option.value));
                setSelectedContacts([...new Set([...selectedContacts, ...values])]);
              }}
            >
              {contacts
                .filter((contact) => !selectedContacts.includes(contact.id))
                .map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} - {contact.email}
                  </option>
                ))}
            </select>
            <div className="flex gap-2">
              <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleSaveEdit}>
                Salvar
              </button>
              <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => setShowEditModal(false)}>
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
