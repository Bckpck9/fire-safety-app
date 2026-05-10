import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Dashboard() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data))
  }, [])

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Добро пожаловать в систему пожарной безопасности</h1>
      {user && <p style={styles.sub}>Вы вошли как: <strong>{user.login}</strong> ({user.role})</p>}
      <div style={styles.cards}>
        <div style={styles.card} onClick={() => navigate('/objects')}>
          Управление объектами
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { padding: '40px' },
  title: { color: '#c0392b', marginBottom: '10px' },
  sub: { color: '#555', marginBottom: '30px' },
  cards: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  card: { background: 'white', border: '1px solid #ddd', borderRadius: '8px',
    padding: '30px', fontSize: '18px', flex: '1', minWidth: '200px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)', textAlign: 'center',
    cursor: 'pointer', maxWidth: '300px' }
}

export default Dashboard