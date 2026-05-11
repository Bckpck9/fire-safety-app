import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Objects from './pages/Objects'
import Navbar from './components/Navbar'
import Users from './pages/Users'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Navbar /><Dashboard /></PrivateRoute>} />
        <Route path="/objects" element={<PrivateRoute><Navbar /><Objects /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><Navbar /><Users /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App