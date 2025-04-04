import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Se houver problemas com drag no modo dev, remova StrictMode
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);