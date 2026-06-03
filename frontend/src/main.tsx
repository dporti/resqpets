import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { AnimalListProvider } from './context/AnimalListContext';
import App from './App';
import SosPublicPage from './pages/SosPublicPage';

const isSosPublic = window.location.pathname === '/sos' || window.location.pathname.startsWith('/sos/');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isSosPublic ? (
      <SosPublicPage />
    ) : (
      <AuthProvider>
        <AnimalListProvider>
          <App />
        </AnimalListProvider>
      </AuthProvider>
    )}
  </React.StrictMode>
);
