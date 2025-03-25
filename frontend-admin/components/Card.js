import React from 'react';

const Card = ({ trafego, updateStatus }) => {
  const handleNext = () => {
    const flow = ['hoje', 'amanha', 'aguardando', 'em_producao', 'concluidos'];
    const currentIndex = flow.indexOf(trafego.status);
    const nextStatus = flow[currentIndex + 1] || 'concluidos';
    updateStatus(trafego.id, nextStatus);
  };

  return (
    <div className="card">
      <h4>{trafego.title}</h4>
      <p>Empresa: {trafego.empresa}</p>
      <p>Entrega: {trafego.entrega}</p>
      <button onClick={handleNext}>Mover para próximo</button>
    </div>
  );
};

export default Card;