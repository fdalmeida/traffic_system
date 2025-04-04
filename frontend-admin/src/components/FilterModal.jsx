import React from "react";
import { FaTimes } from "react-icons/fa";

export default function FilterModal({
  onClose,
  filterAccount,
  setFilterAccount,
  filterStatus,
  setFilterStatus,
  filterDeliveryDateFrom,
  setFilterDeliveryDateFrom,
  filterDeliveryDateTo,
  setFilterDeliveryDateTo,
  accounts,
  statuses,
  hasActiveFilters,
  handleClearFilters,
  applyLocalFilters,
}) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg relative w-[90%] max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500"
        >
          <FaTimes />
        </button>
        <h2 className="text-xl font-bold mb-4 text-center">
          Filtrar Tráfegos
        </h2>
        <hr className="border-t border-gray-300 mb-4" />
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Conta
        </label>
        <select
          className="w-full p-2 border rounded mb-4"
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
        >
          <option value="">Todas as Contas</option>
          {accounts?.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.account_name}
            </option>
          ))}
        </select>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Situação
        </label>
        <select
          className="w-full p-2 border rounded mb-4"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todas as Situações</option>
          {statuses?.map((status) => (
            <option key={status.id} value={status.id}>
              {status.status_name}
            </option>
          ))}
        </select>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Data de Entrega (de)
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={filterDeliveryDateFrom}
            onChange={(e) => setFilterDeliveryDateFrom(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Data de Entrega (até)
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={filterDeliveryDateTo}
            onChange={(e) => setFilterDeliveryDateTo(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              className="w-1/2 bg-red-500 text-white p-2 rounded"
              onClick={() => {
                handleClearFilters();
                onClose();
              }}
            >
              Remover Filtro
            </button>
          )}
          <button
            className="w-1/2 bg-blue-500 text-white p-2 rounded"
            onClick={() => {
              applyLocalFilters();
              onClose();
            }}
          >
            Filtrar
          </button>
        </div>
      </div>
    </div>
  );
}