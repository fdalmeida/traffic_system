import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import CardItem from './CardItem';

const Board = ({ column }) => {
  return (
    // bg-white => fundo branco
    // shadow-md => leve sombra
    // rounded => cantos arredondados
    // h-[calc(100vh-4rem)] => ocupa quase toda a altura da tela
    // flex flex-col => empilhar verticalmente
    <div className="bg-white shadow-md rounded h-[calc(100vh-4rem)] flex flex-col">
      {/* Título da coluna */}
      <h2 className="text-center font-bold p-2 bg-gray-200 rounded-t">
        {column.title}
      </h2>

      <Droppable droppableId={column.id} direction="vertical">
        {(provided, snapshot) => (
          // flex-1 => ocupa o espaço restante
          // p-2 => padding
          // transition-colors => animação suave ao arrastar
          // se isDraggingOver, aplica bg-gray-50
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 transition-colors ${
              snapshot.isDraggingOver ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            {column.tasks.map((task, index) => (
              <CardItem key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Board;