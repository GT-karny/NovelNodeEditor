import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <div className="dark min-h-screen bg-slate-900">
      <App />
    </div>
  </React.StrictMode>
);
