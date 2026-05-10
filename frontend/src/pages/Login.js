import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

function Login() {
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/login', form)
      localStorage.setItem('token', res.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка входа')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}> Вход в систему</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} placeholder="Логин"
            value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} />
          <input style={styles.input} type="password" placeholder="Пароль"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <button style={styles.btn} type="submit">Войти</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' },
  box: { background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '350px' },
  title: { textAlign: 'center', color: '#c0392b', marginBottom: '20px' },
  input: { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px',
    border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '10px', backgroundColor: '#c0392b', color: 'white',
    border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' },
  error: { color: 'red', textAlign: 'center', marginBottom: '10px' }
}

export default Login