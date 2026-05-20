import { useState } from 'react'
import { useNavigate} from 'react-router-dom'
import api from '../api/axios'

function Login() {
    //состояние для хранения данных формы
    const [form, setForm] = useState({ login: '', password: '' })
    //состояние для хранения сообщения об ошибке
    const [error, setError] = useState('')
    const navigate = useNavigate()//хук для программного перехода на другие страницы

    //обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault()//отменяем стандартную перезагрузку страницы браузером
        try {
            //отправляем post запрос на бэкенд с данными из формы
            const res = await api.post('/auth/login', form)
            //если запрос успешен сохраняем полученный токен в локальное хранилище
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
            </div>
        </div>
    )
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' },
    box: { background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: '350px' },
    title: { textAlign: 'center', color: '#c0392b', marginBottom: '20px' },
    input: {
        width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px',
        border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box'
    },
    btn: {
        width: '100%', padding: '10px', backgroundColor: '#c0392b', color: 'white',
        border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer'
    },
    error: { color: 'red', textAlign: 'center', marginBottom: '10px' }
}

export default Login