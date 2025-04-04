import React from 'react';
import Board from './Board';

export default function Dashboard({ columns, onCardClick, toggleDestacado }) {
  return (
    <div className="grid grid-cols-6 gap-4 p-4 w-full">
      {columns.map(col => (
        <Board
          key={col.id}
          column={col}
          onCardClick={onCardClick}
          toggleDestacado={toggleDestacado}
        />
      ))}
    </div>
  );
}