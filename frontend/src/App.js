import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Objects from './pages/Objects'
import Navbar from './components/Navbar'
import ObjectDetails from './pages/ObjectDetails'
import Users from './pages/Users'


//приватный роут
//Если токен есть — показывает страницу
//Если нет — перенаправляет (Navigate) на страницу входа.
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  return (
    //BrowserRouter включает поддержку навигации через адресную строку
    <BrowserRouter>

      <Routes>

        <Route
          path="/users"
          element={
            <PrivateRoute>
              <Navbar />
              <Users />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Navbar />
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/objects"
          element={
            <PrivateRoute>
              <Navbar />
              <Objects />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />

        <Route
          path="/objects/:id"
          element={
            <PrivateRoute>
              <Navbar />
              <ObjectDetails />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>

  )
}

export default App