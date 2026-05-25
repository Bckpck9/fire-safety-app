import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Users() {
    const [users, setUsers] = useState([])
    const [error, setError] = useState('')
    const [editId, setEditId] = useState(null)
    const [form, setForm] = useState({
        login: '',
        email: '',
        role: 'USER'
    })

    const navigate = useNavigate()

    const fetchUsers = async () => {
        try {
            setError('')
            const res = await api.get('/users')
            setUsers(res.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Нет доступа или ошибка загрузки')
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleEdit = (user) => {
        setEditId(user.id)

        setForm({
            login: user.login || '',
            email: user.email || '',
            role: user.role || 'USER'
        })
    }

    const handleCancel = () => {
        setEditId(null)

        setForm({
            login: '',
            email: '',
            role: 'USER'
        })

        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!form.login.trim()) {
            return setError('Введите логин пользователя')
        }

        if (!form.email.trim()) {
            return setError('Введите email пользователя')
        }

        const oldUser = users.find(user => user.id === editId)

        if (oldUser && oldUser.role !== form.role) {
            const confirmed = window.confirm(
                `Вы действительно хотите изменить роль пользователя ${oldUser.login} с ${oldUser.role} на ${form.role}?`
            )

            if (!confirmed) {
                return
            }
        }

        try {
            const res = await api.put(`/users/${editId}`, form)

            setUsers(users.map(user => {
                if (user.id === editId) {
                    return res.data
                }

                return user
            }))

            handleCancel()
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при обновлении пользователя')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            return
        }

        try {
            await api.delete(`/users/${id}`)
            setUsers(users.filter(user => user.id !== id))
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при удалении пользователя')
        }
    }

    return (
        <div style={styles.container}>
            <button onClick={() => navigate('/')} style={styles.backBtn}>
                ← Назад
            </button>

            <h2 style={styles.title}>Управление пользователями</h2>

            {error && <p style={styles.error}>{error}</p>}

            {editId && (
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h3 style={styles.formTitle}>Редактирование пользователя</h3>

                    <input
                        style={styles.input}
                        placeholder="Логин"
                        value={form.login}
                        onChange={e => setForm({ ...form, login: e.target.value })}
                    />

                    <input
                        style={styles.input}
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                    />

                    <select
                        style={styles.input}
                        value={form.role}
                        onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="USER">USER</option>
                        <option value="SPECIALIST">SPECIALIST</option>
                        <option value="ADMIN">ADMIN</option>
                    </select>

                    <div style={styles.formButtons}>
                        <button style={styles.saveBtn} type="submit">
                            Сохранить
                        </button>

                        <button style={styles.cancelBtn} type="button" onClick={handleCancel}>
                            Отмена
                        </button>
                    </div>
                </form>
            )}

            <table style={styles.table}>
                <thead>
                    <tr style={styles.thead}>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Логин</th>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Роль</th>
                        <th style={styles.th}>Дата создания</th>
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
                                <span style={styles.roleBadge}>{user.role}</span>
                            </td>
                            <td style={styles.td}>
                                {user.createdAt
                                    ? new Date(user.createdAt).toLocaleString('ru-RU')
                                    : 'Не указана'}
                            </td>
                            <td style={styles.td}>
                                <button style={styles.editBtn} onClick={() => handleEdit(user)}>
                                    Изменить
                                </button>

                                <button style={styles.deleteBtn} onClick={() => handleDelete(user.id)}>
                                    Удалить
                                </button>
                            </td>
                        </tr>
                    ))}

                    {users.length === 0 && !error && (
                        <tr>
                            <td colSpan="6" style={styles.empty}>
                                Пользователи не найдены
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

const styles = {
    container: {
        padding: '40px'
    },
    title: {
        color: '#c0392b',
        marginBottom: '20px'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        background: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
    },
    thead: {
        backgroundColor: '#c0392b',
        color: 'white'
    },
    th: {
        padding: '12px 16px',
        textAlign: 'left'
    },
    tr: {
        borderBottom: '1px solid #eee'
    },
    td: {
        padding: '12px 16px'
    },
    roleBadge: {
        background: '#f4f4f4',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '13px',
        color: '#555',
        fontWeight: 'bold'
    },
    editBtn: {
        background: '#f39c12',
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        marginRight: '8px'
    },
    deleteBtn: {
        background: '#c0392b',
        color: 'white',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px'
    },
    error: {
        color: 'red',
        marginBottom: '10px'
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: '#c0392b',
        fontSize: '16px',
        cursor: 'pointer',
        marginBottom: '16px',
        padding: 0,
        fontWeight: 'bold'
    },
    form: {
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
    },
    formTitle: {
        marginTop: 0,
        color: '#c0392b'
    },
    input: {
        width: '100%',
        padding: '10px',
        marginBottom: '12px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '14px',
        boxSizing: 'border-box'
    },
    formButtons: {
        display: 'flex',
        gap: '10px'
    },
    saveBtn: {
        background: '#27ae60',
        color: 'white',
        border: 'none',
        padding: '10px 18px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    cancelBtn: {
        background: '#777',
        color: 'white',
        border: 'none',
        padding: '10px 18px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    empty: {
        textAlign: 'center',
        padding: '20px',
        color: '#999'
    }
}

export default Users