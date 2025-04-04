import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const CardItem = ({ task, index }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        // bg-white => fundo branco
        // shadow => sombra leve
        // rounded => cantos arredondados
        // mb-2 => margin bottom
        // cursor-pointer => mostra que é clicável
        // se isDragging => bg-blue-50
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded shadow p-2 mb-2 cursor-pointer transition-colors ${
            snapshot.isDragging ? 'bg-blue-50' : ''
          }`}
        >
          {task.content}
        </div>
      )}
    </Draggable>
  );
};

export default CardItem;