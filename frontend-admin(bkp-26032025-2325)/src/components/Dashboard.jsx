import React from 'react';
import Board from './Board';

const Dashboard = ({ columns }) => {
  return (
    // grid grid-cols-6 => 6 colunas fixas
    // gap-4 => espaçamento entre colunas
    // w-full => ocupa 100% da largura
    <div className="grid grid-cols-6 gap-4 w-full">
      {columns.map(column => (
        <Board key={column.id} column={column} />
      ))}
    </div>
  );
};

export default Dashboard;