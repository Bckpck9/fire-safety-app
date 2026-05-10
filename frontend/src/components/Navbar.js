import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>Пожарная безопасность</div>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Главная</Link>
        <Link to="/objects" style={styles.link}>Объекты</Link>
        <button onClick={logout} style={styles.btn}>Выйти</button>
      </div>
    </nav>
  )
}

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#c0392b', padding: '10px 30px', color: 'white' },
  brand: { fontSize: '20px', fontWeight: 'bold' },
  links: { display: 'flex', gap: '20px', alignItems: 'center' },
  link: { color: 'white', textDecoration: 'none', fontSize: '16px' },
  btn: { background: 'white', color: '#c0392b', border: 'none', padding: '6px 14px',
    borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
}

export default Navbar