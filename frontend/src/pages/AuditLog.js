import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function AuditLog() {
    const [logs, setLogs] = useState([])
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [filterAction, setFilterAction] = useState('')

    const navigate = useNavigate()

    const actionLabels = {
        REGISTER: 'Регистрация',
        LOGIN_FAILED: 'Ошибка входа',
        LOGIN_PASSWORD_SUCCESS: 'Пароль введён',
        LOGIN_SUCCESS: 'Вход в систему',
        LOGOUT: 'Выход из системы',
        ACCESS_DENIED: 'Отказ в доступе',
        '2FA_FAILED': 'Ошибка 2FA',

        CREATE_OBJECT: 'Создание объекта',
        UPDATE_OBJECT: 'Изменение объекта',
        DELETE_OBJECT: 'Удаление объекта',

        UPDATE_USER: 'Изменение пользователя',
        DELETE_USER: 'Удаление пользователя',

        SELF_DELETE_BLOCKED: 'Блокировка самоудаления',
        SELF_ROLE_CHANGE_BLOCKED: 'Блокировка изменения своей роли'
    }

    const entityLabels = {
        User: 'Пользователь',
        FireObject: 'Объект',
        Auth: 'Авторизация'
    }

    const formatDetails = (details) => {
        if (!details) {
            return '-'
        }

        return String(details)
            .replace('риск: LOW', 'риск: Низкий')
            .replace('риск: MEDIUM', 'риск: Средний')
            .replace('риск: HIGH', 'риск: Высокий')
            .replace('риск: CRITICAL', 'риск: Критический')
            .replace('роль: USER', 'роль: Пользователь')
            .replace('роль: SPECIALIST', 'роль: Специалист')
            .replace('роль: ADMIN', 'роль: Администратор')
    }

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setError('')

                const res = await api.get('/audit-log', {
                    params: {
                        page,
                        limit: 10,
                        action: filterAction || undefined
                    }
                })

                setLogs(res.data.logs)
                setTotalPages(res.data.pages)
            } catch (err) {
                setError(err.response?.data?.message || 'Не удалось загрузить журнал действий')
            }
        }

        fetchLogs()
    }, [page, filterAction])

    return (
        <div style={styles.container}>
            <button onClick={() => navigate('/')} style={styles.backBtn}>
                ← Назад
            </button>

            <h2 style={styles.title}>Журнал действий</h2>

            {error && <p style={styles.error}>{error}</p>}

            <div style={styles.filters}>
                <select
                    style={styles.filterInput}
                    value={filterAction}
                    onChange={e => {
                        setFilterAction(e.target.value)
                        setPage(1)
                    }}
                >
                    <option value="">Все действия</option>
                    <option value="LOGIN_SUCCESS">Вход в систему</option>
                    <option value="LOGOUT">Выход из системы</option>
                    <option value="ACCESS_DENIED">Отказ в доступе</option>
                    <option value="CREATE_OBJECT">Создание объекта</option>
                    <option value="UPDATE_OBJECT">Изменение объекта</option>
                    <option value="DELETE_OBJECT">Удаление объекта</option>
                    <option value="UPDATE_USER">Изменение пользователя</option>
                    <option value="DELETE_USER">Удаление пользователя</option>
                    <option value="SELF_DELETE_BLOCKED">Блокировка самоудаления</option>
                    <option value="SELF_ROLE_CHANGE_BLOCKED">Блокировка изменения своей роли</option>
                </select>

                <button
                    style={styles.resetBtn}
                    onClick={() => {
                        setFilterAction('')
                        setPage(1)
                    }}
                >
                    Сбросить
                </button>
            </div>

            <table style={styles.table}>
                <thead>
                    <tr style={styles.thead}>
                        <th style={styles.th}>Дата</th>
                        <th style={styles.th}>Пользователь</th>
                        <th style={styles.th}>Действие</th>
                        <th style={styles.th}>Сущность</th>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Детали</th>
                    </tr>
                </thead>

                <tbody>
                    {logs.map(log => (
                        <tr key={log.id} style={styles.tr}>
                            <td style={styles.td}>
                                {log.createdAt
                                    ? new Date(log.createdAt).toLocaleString('ru-RU')
                                    : 'Не указана'}
                            </td>

                            <td style={styles.td}>{log.user?.login || 'Система'}</td>

                            <td style={styles.td}>
                                <span style={styles.actionBadge}>
                                    {actionLabels[log.action] || log.action}
                                </span>
                            </td>

                            <td style={styles.td}>
                                {entityLabels[log.entity] || log.entity || '-'}
                            </td>

                            <td style={styles.td}>{log.entityId || '-'}</td>

                            <td style={styles.td}>{formatDetails(log.details)}</td>
                        </tr>
                    ))}

                    {logs.length === 0 && !error && (
                        <tr>
                            <td colSpan="6" style={styles.empty}>
                                Записи журнала отсутствуют
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div style={styles.pagination}>
                    <button
                        style={{
                            ...styles.pageBtn,
                            opacity: page === 1 ? 0.5 : 1,
                            cursor: page === 1 ? 'not-allowed' : 'pointer'
                        }}
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Назад
                    </button>

                    <span style={styles.pageInfo}>
                        Страница {page} из {totalPages}
                    </span>

                    <button
                        style={{
                            ...styles.pageBtn,
                            opacity: page === totalPages ? 0.5 : 1,
                            cursor: page === totalPages ? 'not-allowed' : 'pointer'
                        }}
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        Вперёд
                    </button>
                </div>
            )}
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
    filters: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        alignItems: 'center'
    },
    filterInput: {
        padding: '8px 12px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '14px'
    },
    resetBtn: {
        padding: '8px 16px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        background: 'white',
        cursor: 'pointer',
        fontSize: '14px'
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
        textAlign: 'left',
        fontSize: '14px'
    },
    tr: {
        borderBottom: '1px solid #eee'
    },
    td: {
        padding: '12px 16px',
        fontSize: '14px',
        verticalAlign: 'top'
    },
    actionBadge: {
        background: '#f4f4f4',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#555',
        fontWeight: 'bold'
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
    empty: {
        textAlign: 'center',
        padding: '20px',
        color: '#999'
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        marginTop: '20px'
    },
    pageBtn: {
        padding: '8px 20px',
        backgroundColor: '#c0392b',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px'
    },
    pageInfo: {
        fontSize: '14px',
        color: '#555'
    }
}

export default AuditLog