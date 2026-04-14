/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Entrar from './pages/Entrar';
import Cadastrar from './pages/Cadastrar';
import Painel from './pages/Painel';
import NovaTransacao from './pages/NovaTransacao';
import Transacoes from './pages/Transacoes';
import AdminDashboard from './pages/AdminDashboard';
import Relatorios from './pages/Relatorios';
import Metas from './pages/Metas';
import AdminUserTransactions from './pages/AdminUserTransactions';
import AdminTransactionForm from './pages/AdminTransactionForm';
import Inicio from './pages/Inicio';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import PezzyIA from './pages/PezzyIA';
import PerfilInvestidor from './pages/PerfilInvestidor';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Entrar />} />
      <Route path="/register" element={<Cadastrar />} />
      <Route path="/forgot-password" element={<EsqueciSenha />} />
      <Route path="/reset-password" element={<RedefinirSenha />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Painel />} />
        <Route path="transactions" element={<Transacoes />} />
        <Route path="transactions/new" element={<NovaTransacao />} />
        <Route path="reports" element={<Relatorios />} />
        <Route path="goals" element={<Metas />} />
        <Route path="ai" element={<PezzyIA />} />
        <Route path="perfil-investidor" element={<PerfilInvestidor />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/users/:id/transactions" element={<AdminUserTransactions />} />
        <Route path="admin/users/:id/transactions/new" element={<AdminTransactionForm />} />
        <Route path="admin/users/:id/transactions/:txId/edit" element={<AdminTransactionForm />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="finance-theme">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
