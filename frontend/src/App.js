import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AccessDenied from './pages/AccessDenied'
import api from './api/axios'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Objects from './pages/Objects'
import ObjectDetails from './pages/ObjectDetails'
import Users from './pages/Users'
import Navbar from './components/Navbar'
import AuditLog from './pages/AuditLog'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ padding: '40px' }}>Проверка доступа...</div>
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/access-denied" replace />
  }

  return children
}

const ProtectedLayout = ({ children }) => {
  return (
    <PrivateRoute>
      <Navbar />
      {children}
    </PrivateRoute>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/objects"
          element={
            <ProtectedLayout>
              <Objects />
            </ProtectedLayout>
          }
        />

        <Route
          path="/objects/:id"
          element={
            <ProtectedLayout>
              <ObjectDetails />
            </ProtectedLayout>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <Users />
              </AdminRoute>
            </ProtectedLayout>
          }
        />

        <Route
          path="/audit-log"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <AuditLog />
              </AdminRoute>
            </ProtectedLayout>
          }
        />
        <Route
          path="/access-denied"
          element={
            <ProtectedLayout>
              <AccessDenied />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App