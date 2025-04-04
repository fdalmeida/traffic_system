import React, { useState } from 'react';

export default function CreateModal({ onClose, onCreate }) {
  const [empresa, setEmpresa] = useState('');
  const [conta, setConta] = useState('');
  const [abertura, setAbertura] = useState('');
  const [entrega, setEntrega] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [situacao, setSituacao] = useState('column-futuro');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newId = 'task-' + Math.floor(Math.random() * 1000000);
    const novoCard = {
      id: newId,
      empresa,
      conta,
      abertura,
      entrega,
      assunto,
      resumo: descricao,
      destacado: false
    };
    onCreate(novoCard, situacao);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-md max-w-xl w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-bold">Criar Novo Tráfego</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Empresa
            </label>
            <input
              className="border border-gray-300 rounded w-full p-2 text-sm"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conta
            </label>
            <input
              className="border border-gray-300 rounded w-full p-2 text-sm"
              value={conta}
              onChange={(e) => setConta(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Abertura
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded w-full p-2 text-sm"
                value={abertura}
                onChange={(e) => setAbertura(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Entrega
              </label>
              <input
                type="date"
                className="border border-gray-300 rounded w-full p-2 text-sm"
                value={entrega}
                onChange={(e) => setEntrega(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assunto
            </label>
            <input
              className="border border-gray-300 rounded w-full p-2 text-sm"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (O que deve ser feito)
            </label>
            <textarea
              className="border border-gray-300 rounded w-full p-2 text-sm h-24"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Situação
            </label>
            <select
              className="border border-gray-300 rounded w-full p-2 text-sm"
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
            >
              <option value="column-futuro">Futuro</option>
              <option value="column-em-andamento">Em andamento</option>
              <option value="column-finalizado">Finalizado</option>
              <option value="column-paralisado">Paralisado</option>
              <option value="column-cancelado">Cancelado</option>
              <option value="column-excluido">Excluído</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-24 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-24 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded text-sm"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}