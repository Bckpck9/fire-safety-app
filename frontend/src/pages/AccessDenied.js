import { useNavigate } from 'react-router-dom'

function AccessDenied() {
    const navigate = useNavigate()

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Доступ запрещён</h2>

                <p style={styles.text}>
                    У вашей роли нет прав для просмотра этого раздела.
                </p>

                <button style={styles.btn} onClick={() => navigate('/')}>
                    Вернуться на главную
                </button>
            </div>
        </div>
    )
}

const styles = {
    container: {
        padding: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        backgroundColor: '#f5f5f5'
    },
    card: {
        background: 'white',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '420px',
        textAlign: 'center'
    },
    title: {
        color: '#c0392b',
        marginBottom: '12px'
    },
    text: {
        color: '#555',
        marginBottom: '24px'
    },
    btn: {
        backgroundColor: '#c0392b',
        color: 'white',
        border: 'none',
        padding: '10px 18px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    }
}

export default AccessDenied