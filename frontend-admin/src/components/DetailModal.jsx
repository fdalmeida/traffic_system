import React from 'react';

export default function DetailModal({ task, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
      <div className="bg-white p-4 rounded w-[400px] shadow-md">
        <h2 className="text-2xl font-bold mb-2">{task.assunto}</h2>
        <p className="text-sm text-gray-500 mb-4">
          <strong>Empresa:</strong> {task.empresa} | <strong>Conta:</strong> {task.conta}
        </p>
        <div className="bg-gray-100 p-2 rounded mb-4">
          <h3 className="font-semibold">Resumo</h3>
          <p className="text-sm">{task.resumo}</p>
        </div>
        <p className="text-sm mb-2">
          <strong>Data de Abertura:</strong> {task.abertura}
        </p>
        <p className="text-sm mb-4">
          <strong>Data de Entrega:</strong> {task.entrega}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-300 rounded"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}