import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Users() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data)).catch(() => {
      setError('Нет доступа или ошибка загрузки')
    })
  }, [])

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/users/${id}/role`, { role })
      setUsers(users.map(u => u.id === id ? { ...u, role } : u))
    } catch (err) {
      setError('Ошибка при изменении роли')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Удалить пользователя?')) {
      try {
        await api.delete(`/users/${id}`)
        setUsers(users.filter(u => u.id !== id))
      } catch (err) {
        setError('Ошибка при удалении')
      }
    }
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/')} style={styles.backBtn}>← Назад</button>
      <h2 style={styles.title}>Управление пользователями</h2>
      {error && <p style={styles.error}>{error}</p>}
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Логин</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Роль</th>
            <th style={styles.th}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} style={styles.tr}>
              <td style={styles.td}>{user.id}</td>
              <td style={styles.td}>{user.login}</td>
              <td style={styles.td}>{user.email}</td>
              <td style={styles.td}>
                <select style={styles.select} value={user.role}
                  onChange={e => handleRoleChange(user.id, e.target.value)}>
                  <option value="USER">USER</option>
                  <option value="INSPECTOR">INSPECTOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
              <td style={styles.td}>
                <button style={styles.deleteBtn} onClick={() => handleDelete(user.id)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  container: { padding: '40px' },
  title: { color: '#c0392b', marginBottom: '20px' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white',
    borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  thead: { backgroundColor: '#c0392b', color: 'white' },
  th: { padding: '12px 16px', textAlign: 'left' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px 16px' },
  select: { padding: '6px', borderRadius: '4px', border: '1px solid #ddd' },
  deleteBtn: { background: '#c0392b', color: 'white', border: 'none', padding: '6px 12px',
    borderRadius: '4px', cursor: 'pointer' },
  error: { color: 'red', marginBottom: '10px' },
  backBtn: { background: 'none', border: 'none', color: '#c0392b', fontSize: '16px',
    cursor: 'pointer', marginBottom: '16px', padding: 0, fontWeight: 'bold' }
}

export default Users