/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewTransaction from './pages/NewTransaction';
import Transactions from './pages/Transactions';
import AdminDashboard from './pages/AdminDashboard';
import Reports from './pages/Reports';
import Goals from './pages/Goals';
import AdminUserTransactions from './pages/AdminUserTransactions';
import AdminTransactionForm from './pages/AdminTransactionForm';
import Landing from './pages/Landing';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="transactions/new" element={<NewTransaction />} />
        <Route path="reports" element={<Reports />} />
        <Route path="goals" element={<Goals />} />
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
