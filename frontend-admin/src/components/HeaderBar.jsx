import React from 'react';
import { FaStar } from 'react-icons/fa';

export default function HeaderBar({ onFilterClick, onNewClick }) {
  return (
    <div className="flex items-center bg-blue-700 px-4 py-2 text-white">
      <h1 className="text-xl font-bold mr-4">Quadro de Tráfegos</h1>

      {/* Estrela no cabeçalho, usando FaStar */}
      <button className="px-2 py-1 hover:bg-blue-600 rounded text-sm mr-4">
        <FaStar className="w-4 h-4 inline-block text-white" />
      </button>

      <div className="flex items-center bg-blue-600 px-2 py-1 rounded mr-4 w-64">
        <svg
          className="w-4 h-4 text-white mr-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.867-4.867m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 015.633 12.133z"
          />
        </svg>
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-transparent focus:outline-none text-sm w-full"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onFilterClick}
          className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm"
        >
          Filtrar
        </button>
        <button
          onClick={onNewClick}
          className="bg-green-500 hover:bg-green-400 px-3 py-1 rounded text-sm"
        >
          Novo
        </button>
        <img
          src="https://via.placeholder.com/32"
          alt="User Avatar"
          className="w-8 h-8 rounded-full ml-3"
        />
      </div>
    </div>
  );
}