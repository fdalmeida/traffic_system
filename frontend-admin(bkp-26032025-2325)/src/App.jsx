import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import Dashboard from './components/Dashboard';

const App = () => {
  const [columns, setColumns] = useState([
    {
      id: 'column-1',
      title: 'Backlog',
      tasks: [
        { id: 'task-1', content: 'Tarefa 1' },
        { id: 'task-2', content: 'Tarefa 2' },
        { id: 'task-3', content: 'Tarefa 3' },
      ],
    },
    {
      id: 'column-2',
      title: 'To Do',
      tasks: [
        { id: 'task-4', content: 'Tarefa 4' },
        { id: 'task-5', content: 'Tarefa 5' },
        { id: 'task-6', content: 'Tarefa 6' },
      ],
    },
    {
      id: 'column-3',
      title: 'In Progress',
      tasks: [
        { id: 'task-7', content: 'Tarefa 7' },
        { id: 'task-8', content: 'Tarefa 8' },
        { id: 'task-9', content: 'Tarefa 9' },
      ],
    },
    {
      id: 'column-4',
      title: 'Review',
      tasks: [
        { id: 'task-10', content: 'Tarefa 10' },
        { id: 'task-11', content: 'Tarefa 11' },
        { id: 'task-12', content: 'Tarefa 12' },
      ],
    },
    {
      id: 'column-5',
      title: 'Blocked',
      tasks: [
        { id: 'task-13', content: 'Tarefa 13' },
        { id: 'task-14', content: 'Tarefa 14' },
        { id: 'task-15', content: 'Tarefa 15' },
      ],
    },
    {
      id: 'column-6',
      title: 'Done',
      tasks: [
        { id: 'task-16', content: 'Tarefa 16' },
        { id: 'task-17', content: 'Tarefa 17' },
        { id: 'task-18', content: 'Tarefa 18' },
      ],
    },
  ]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return; // se arrastou fora das colunas

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return; // arrastou e soltou no mesmo lugar
    }

    // 1) movimento dentro da mesma coluna
    if (source.droppableId === destination.droppableId) {
      const column = columns.find(col => col.id === source.droppableId);
      const newTasks = Array.from(column.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      const newColumns = columns.map(col =>
        col.id === column.id ? { ...col, tasks: newTasks } : col
      );
      setColumns(newColumns);
    } else {
      // 2) movimento entre colunas
      const sourceColumn = columns.find(col => col.id === source.droppableId);
      const destColumn = columns.find(col => col.id === destination.droppableId);

      const sourceTasks = Array.from(sourceColumn.tasks);
      const destTasks = Array.from(destColumn.tasks);

      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);

      const newColumns = columns.map(col => {
        if (col.id === sourceColumn.id) return { ...col, tasks: sourceTasks };
        if (col.id === destColumn.id) return { ...col, tasks: destTasks };
        return col;
      });
      setColumns(newColumns);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {/* p-4 => padding 1rem */}
      <div className="min-h-screen bg-gray-100 p-4">
        <Dashboard columns={columns} />
      </div>
    </DragDropContext>
  );
};

export default App;