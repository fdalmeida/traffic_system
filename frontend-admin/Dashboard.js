import React, { useEffect, useState } from 'react';
import Column from './components/Column';
import './styles/dashboard.css';

const mockData = [
  { id: '1', title: 'Tráfego A', status: 'hoje', empresa: 'OURO FINO', entrega: '2025-03-24' },
  { id: '2', title: 'Tráfego B', status: 'amanha', empresa: 'RIG', entrega: '2025-03-25' },
  { id: '3', title: 'Tráfego C', status: 'aguardando', empresa: 'BRAMIAR', entrega: '2025-03-28' },
];

const Dashboard = ({ user }) => {
  const [trafeegos, setTrafeegos] = useState([]);

  useEffect(() => {
    if (user.nivel !== 1) {
      window.location.href = '/';
    } else {
      // mock - replace with fetch to backend
      setTrafeegos(mockData);
    }
  }, [user]);

  const updateStatus = (id, newStatus) => {
    setTrafeegos(prev =>
      prev.map(t => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const columns = ['hoje', 'amanha', 'aguardando', 'em_producao', 'concluidos'];

  return (
    <div className="dashboard">
      {columns.map(status => (
        <Column
          key={status}
          status={status}
          trafegos={trafeegos.filter(t => t.status === status)}
          updateStatus={updateStatus}
        />
      ))}
    </div>
  );
};

export default Dashboard;