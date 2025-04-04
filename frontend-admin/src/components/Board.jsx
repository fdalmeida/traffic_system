import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import CardItem from './CardItem';

export default function Board({ column, onCardClick, toggleDestacado }) {
  return (
    <div className="bg-white bg-opacity-90 shadow-md rounded-md h-[calc(100vh-8rem)] flex flex-col">
      <div className="bg-gray-200 p-2 text-center font-bold rounded-t-md">
        {column.title}
      </div>
      <Droppable droppableId={column.id} direction="vertical">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 transition-colors overflow-y-auto ${
              snapshot.isDraggingOver ? 'bg-gray-100' : ''
            }`}
          >
            {column.tasks.map((task, index) => (
              <CardItem
                key={task.id}
                task={task}
                index={index}
                situation={column.title}
                onClick={() => onCardClick(task)}
                toggleDestacado={toggleDestacado}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}