import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { FaStar } from 'react-icons/fa';

function getSituationClasses(situation) {
  switch (situation) {
    case 'Futuro':
      return 'border-gray-500';
    case 'Em andamento':
      return 'border-green-500';
    case 'Finalizado':
      return 'border-blue-700';
    case 'Paralisado':
      // Trocamos de amarelo para laranja
      return 'border-orange-500';
    case 'Cancelado':
      return 'border-red-500';
    case 'Excluído':
      return 'border-gray-300 text-gray-400';
    default:
      return 'border-blue-400';
  }
}

export default function CardItem({ task, index, situation, onClick, toggleDestacado }) {
  const situationClasses = getSituationClasses(situation);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`relative bg-white rounded shadow p-3 mb-2 cursor-pointer
                      transition-colors border-l-4 ${situationClasses}
                      ${snapshot.isDragging ? 'bg-blue-50' : ''}`}
        >
          {/* Botão de destaque com FaStar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleDestacado(task.id);
            }}
            className="absolute top-1 right-1 focus:outline-none"
          >
            {task.destacado ? (
              // Estrela dourada quando destacado
              <FaStar className="w-5 h-5 text-yellow-400" />
            ) : (
              // Estrela cinza claro quando não destacado
              <FaStar className="w-5 h-5 text-gray-200" />
            )}
          </button>

          <p className="text-xs">
            <strong>{task.empresa}</strong> | {task.conta}
          </p>
          <h3 className="text-sm font-bold mt-1">{task.assunto}</h3>
          <p className="text-xs mt-1">
            Abertura: {task.abertura} | Entrega: {task.entrega}
          </p>
          <p className="text-xs mt-1 line-clamp-2">
            {task.resumo}
          </p>
        </div>
      )}
    </Draggable>
  );
}