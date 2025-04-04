import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import HeaderBar from './components/HeaderBar';
import Dashboard from './components/Dashboard';
import FilterModal from './components/FilterModal';
import CreateModal from './components/CreateModal';
import DetailModal from './components/DetailModal';

const initialColumns = [
  {
    id: 'column-futuro',
    title: 'Futuro',
    tasks: [
      {
        id: 'task-1',
        empresa: 'Ouro Fino',
        conta: 'Group / Grupo',
        abertura: '17/03/2025',
        entrega: '31/03/2025',
        assunto: 'Reunião de Vendas',
        resumo: 'Resumo breve do que será discutido na reunião.',
        destacado: false
      },
      {
        id: 'task-2',
        empresa: 'Construtora ABC',
        conta: 'Construção Civil',
        abertura: '20/03/2025',
        entrega: '02/04/2025',
        assunto: 'Nova licitação',
        resumo: 'Participar da licitação para obra pública...',
        destacado: false
      }
    ]
  },
  {
    id: 'column-em-andamento',
    title: 'Em andamento',
    tasks: [
      {
        id: 'task-3',
        empresa: 'Agro XPTO',
        conta: 'Agro Business',
        abertura: '01/04/2025',
        entrega: '15/04/2025',
        assunto: 'Feira Agrícola',
        resumo: 'Preparar stand e apresentações na feira...',
        destacado: false
      }
    ]
  },
  {
    id: 'column-finalizado',
    title: 'Finalizado',
    tasks: [
      {
        id: 'task-4',
        empresa: 'Grupo Tech',
        conta: 'TI e Sistemas',
        abertura: '10/02/2025',
        entrega: '20/03/2025',
        assunto: 'Implantação de ERP',
        resumo: 'Sistema implantado com sucesso e entregue ao cliente.',
        destacado: false
      }
    ]
  },
  {
    id: 'column-paralisado',
    title: 'Paralisado',
    tasks: [
      {
        id: 'task-5',
        empresa: 'Ouro Fino',
        conta: 'Group / Grupo',
        abertura: '17/03/2025',
        entrega: '31/03/2025',
        assunto: 'Parado por dependência externa',
        resumo: 'Aguardando retorno do fornecedor.',
        destacado: false
      }
    ]
  },
  {
    id: 'column-cancelado',
    title: 'Cancelado',
    tasks: []
  },
  {
    id: 'column-excluido',
    title: 'Excluído',
    tasks: []
  }
];

export default function App() {
  const [columns, setColumns] = useState(initialColumns);
  const [showFilter, setShowFilter] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [detailTask, setDetailTask] = useState(null);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    if (source.droppableId === destination.droppableId) {
      const col = columns.find(c => c.id === source.droppableId);
      const newTasks = Array.from(col.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      const newCols = columns.map(c => (c.id === col.id ? { ...c, tasks: newTasks } : c));
      setColumns(newCols);
    } else {
      const sourceCol = columns.find(c => c.id === source.droppableId);
      const destCol = columns.find(c => c.id === destination.droppableId);
      const sourceTasks = Array.from(sourceCol.tasks);
      const destTasks = Array.from(destCol.tasks);
      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);
      const newCols = columns.map(c => {
        if (c.id === sourceCol.id) return { ...c, tasks: sourceTasks };
        if (c.id === destCol.id) return { ...c, tasks: destTasks };
        return c;
      });
      setColumns(newCols);
    }
  };

  const handleCardClick = (task) => {
    setDetailTask(task);
  };

  const toggleDestacado = (taskId) => {
    const newColumns = columns.map(col => {
      const newTasks = col.tasks.map(task => task.id === taskId ? { ...task, destacado: !task.destacado } : task);
      return { ...col, tasks: newTasks };
    });
    setColumns(newColumns);
  };

  const handleFilter = (filtros) => {
    const { destacados, filterAccount, filterStatus, filterDeliveryDateFrom, filterDeliveryDateTo } = filtros;
    let newData = [];
    columns.forEach(col => {
      newData = [...newData, ...col.tasks];
    });
    if (filterAccount) {
      newData = newData.filter(t => Number(t.account_id) === Number(filterAccount));
    }
    if (filterStatus) {
      newData = newData.filter(t => Number(t.status_id) === Number(filterStatus));
    }
    if (filterDeliveryDateFrom) {
      newData = newData.filter(t => t.entrega && new Date(t.entrega) >= new Date(filterDeliveryDateFrom));
    }
    if (filterDeliveryDateTo) {
      newData = newData.filter(t => t.entrega && new Date(t.entrega) <= new Date(filterDeliveryDateTo));
    }
    if (destacados) {
      newData = newData.filter(t => t.destacado);
    }
    // Aqui você pode, se preferir, atualizar os dados de cada coluna ou armazenar o resultado filtrado
    // Neste exemplo, apenas logamos o resultado e fechamos o modal:
    console.log("Filtros aplicados:", newData);
    setShowFilter(false);
  };

  return (
    <div className="min-h-screen bg-[url('/images/board-bg.jpg')] bg-cover bg-no-repeat">
      <HeaderBar
        onFilterClick={() => setShowFilter(true)}
        onNewClick={() => setShowCreate(true)}
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <Dashboard
          columns={columns}
          onCardClick={handleCardClick}
          toggleDestacado={toggleDestacado}
        />
      </DragDropContext>
      {showFilter && (
        <FilterModal
          onClose={() => setShowFilter(false)}
          filterAccount=""
          setFilterAccount={() => {}}
          filterStatus=""
          setFilterStatus={() => {}}
          filterDeliveryDateFrom=""
          setFilterDeliveryDateFrom={() => {}}
          filterDeliveryDateTo=""
          setFilterDeliveryDateTo={() => {}}
          accounts={[]} // caso tenha contas, passe aqui
          statuses={[]} // idem para status
          hasActiveFilters={false}
          handleClearFilters={() => {}}
          applyLocalFilters={handleFilter}
        />
      )}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(novoCard, situacao) => {
            const idx = columns.findIndex(c => c.id === situacao);
            if (idx !== -1) {
              const newCols = [...columns];
              newCols[idx].tasks.push(novoCard);
              setColumns(newCols);
            }
            setShowCreate(false);
          }}
        />
      )}
      {detailTask && (
        <DetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
        />
      )}
    </div>
  );
}