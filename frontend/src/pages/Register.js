import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Register() {
    const navigate = useNavigate()

    const [form, setForm] = useState({
        login: '',
        email: '',
        password: ''
    })

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        try {
            await api.post('/auth/register', form)

            setSuccess('Регистрация прошла успешно. Сейчас можно войти.')

            setTimeout(() => {
                navigate('/login')
            }, 1000)
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка регистрации')
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.box}>
                <h2 style={styles.title}>Регистрация</h2>

                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>{success}</p>}

                <form onSubmit={handleSubmit}>
                    <input
                        style={styles.input}
                        name="login"
                        placeholder="Логин"
                        value={form.login}
                        onChange={handleChange}
                    />

                    <input
                        style={styles.input}
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                    />

                    <input
                        style={styles.input}
                        name="password"
                        type="password"
                        placeholder="Пароль"
                        value={form.password}
                        onChange={handleChange}
                    />

                    <button style={styles.btn} type="submit">
                        Зарегистрироваться
                    </button>
                </form>

                <p style={styles.linkText}>
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>
            </div>
        </div>
    )
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
    },
    box: {
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '360px'
    },
    title: {
        textAlign: 'center',
        color: '#c0392b',
        marginBottom: '20px'
    },
    input: {
        width: '100%',
        padding: '10px',
        marginBottom: '12px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '16px',
        boxSizing: 'border-box'
    },
    btn: {
        width: '100%',
        padding: '10px',
        backgroundColor: '#c0392b',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer'
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: '10px'
    },
    success: {
        color: 'green',
        textAlign: 'center',
        marginBottom: '10px'
    },
    linkText: {
        textAlign: 'center',
        marginTop: '16px'
    }
}

export default Register