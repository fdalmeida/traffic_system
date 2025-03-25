import React from 'react';
import Card from './Card';

const Column = ({ status, trafegos, updateStatus }) => {
  const titles = {
    hoje: 'Hoje',
    amanha: 'Amanhã',
    aguardando: 'Aguardando Cliente',
    em_producao: 'Em Produção',
    concluidos: 'Concluídos'
  };

  return (
    <div className="column">
      <h2>{titles[status]}</h2>
      {trafegos.map(t => (
        <Card key={t.id} trafego={t} updateStatus={updateStatus} />
      ))}
    </div>
  );
};

export default Column;