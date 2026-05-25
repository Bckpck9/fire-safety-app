import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

function Login() {
    const [form, setForm] = useState({
        login: '',
        password: ''
    })

    const [twoFactorCode, setTwoFactorCode] = useState('')
    const [tempToken, setTempToken] = useState('')
    const [is2FA, setIs2FA] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [loading, setLoading] = useState(false)


    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()

        if (loading || is2FA) {
            return
        }

        setLoading(true)
        setError('')
        setNotice('')

        try {
            const res = await api.post('/auth/login', form)

            if (res.data.requires2FA) {
                setTempToken(res.data.tempToken)
                setIs2FA(true)
                setNotice('Код отправлен в Telegram')
                return
            }

            localStorage.setItem('token', res.data.token)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка входа')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify2FA = async () => {
        setError('')

        try {
            const res = await api.post('/auth/verify-2fa', {
                tempToken,
                code: twoFactorCode
            })

            localStorage.setItem('token', res.data.token)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка подтверждения кода')
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.box}>
                <h2 style={styles.title}>
                    {is2FA ? 'Подтверждение входа' : 'Вход в систему'}
                </h2>

                {error && <p style={styles.error}>{error}</p>}
                {notice && <p style={styles.notice}>{notice}</p>}

                {!is2FA ? (
                    <form onSubmit={handleLogin}>
                        <input
                            style={styles.input}
                            placeholder="Логин"
                            value={form.login}
                            onChange={e => setForm({ ...form, login: e.target.value })}
                        />

                        <input
                            style={styles.input}
                            type="password"
                            placeholder="Пароль"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />

                        <button style={styles.btn} type="submit" disabled={loading}>
                            {loading ? 'Отправка...' : 'Войти'}
                        </button>

                        <p style={styles.linkText}>
                            Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                        </p>
                    </form>
                ) : (
                    <div>
                        <input
                            style={styles.input}
                            placeholder="Код из Telegram"
                            value={twoFactorCode}
                            onChange={e => setTwoFactorCode(e.target.value)}
                        />

                        <button
                            style={styles.btn}
                            type="button"
                            onClick={handleVerify2FA}
                        >
                            Подтвердить
                        </button>

                        <button
                            style={styles.secondaryBtn}
                            type="button"
                            onClick={() => {
                                setIs2FA(false)
                                setTempToken('')
                                setTwoFactorCode('')
                                setNotice('')
                                setError('')
                                setLoading(false)
                                setForm({ login: '', password: '' })
                            }}
                        >
                            Назад
                        </button>
                    </div>
                )}
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
        width: '350px'
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
    secondaryBtn: {
        width: '100%',
        padding: '10px',
        marginTop: '10px',
        backgroundColor: '#777',
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
    notice: {
        color: '#1f5f3b',
        backgroundColor: '#eaf7ef',
        border: '1px solid #b7e2c4',
        borderRadius: '8px',
        padding: '12px 14px',
        textAlign: 'center',
        marginBottom: '16px',
        fontSize: '16px',
        fontWeight: '600',
        lineHeight: '1.4'
    },
    linkText: {
        textAlign: 'center',
        marginTop: '16px'
    }
}

export default Login