import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a1a',
          color: '#ffffff',
          border: '1px solid #2d2d2d',
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#1a1a1a' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a1a' } },
        duration: 3000,
      }}
    />
    <App />
  </React.StrictMode>
);
