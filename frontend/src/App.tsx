import React, { useState } from 'react';
import './App.css';
import { authService } from './services/authService';
import LoginPage from './page/LoginPage';
import DashboardPage from './page/DashboardPage';
import { ToastProvider } from './contexts/ToastContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    authService.isAuthenticated()
  );

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/dashboard/*" element={<DashboardPage onLogout={() => setIsAuthenticated(false)} />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
