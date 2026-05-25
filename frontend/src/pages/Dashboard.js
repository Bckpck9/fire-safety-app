import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Dashboard() {
    const [user, setUser] = useState(null)
    const [stats, setStats] = useState({
        totalObjects: 0,
        highRiskObjects: 0,
        criticalRiskObjects: 0
    })

    const navigate = useNavigate()

    useEffect(() => {
        api.get('/auth/me')
            .then(res => setUser(res.data))
            .catch(() => setUser(null))

        api.get('/objects', {
            params: {
                page: 1,
                limit: 1000
            }
        })
            .then(res => {
                const objects = res.data.objects || []

                setStats({
                    totalObjects: res.data.total || objects.length,
                    highRiskObjects: objects.filter(obj => obj.riskLevel === 'HIGH').length,
                    criticalRiskObjects: objects.filter(obj => obj.riskLevel === 'CRITICAL').length
                })
            })
            .catch(() => {
                setStats({
                    totalObjects: 0,
                    highRiskObjects: 0,
                    criticalRiskObjects: 0
                })
            })
    }, [])

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Добро пожаловать в систему пожарной безопасности</h1>

            {user && (
                <p style={styles.sub}>
                    Вы вошли как: <strong>{user.login}</strong> ({user.role})
                </p>
            )}

            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Всего объектов</span>
                    <strong style={styles.statValue}>{stats.totalObjects}</strong>
                </div>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Высокий риск</span>
                    <strong style={styles.statValue}>{stats.highRiskObjects}</strong>
                </div>

                <div style={styles.statCard}>
                    <span style={styles.statLabel}>Критический риск</span>
                    <strong style={styles.statValue}>{stats.criticalRiskObjects}</strong>
                </div>
            </div>

            <div style={styles.cards}>
                <div style={styles.card} onClick={() => navigate('/objects')}>
                    Управление объектами
                </div>
            </div>
        </div>
    )
}

const styles = {
    container: {
        padding: '40px'
    },
    title: {
        color: '#c0392b',
        marginBottom: '10px'
    },
    sub: {
        color: '#555',
        marginBottom: '30px'
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '30px',
        maxWidth: '800px'
    },
    statCard: {
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
    },
    statLabel: {
        display: 'block',
        color: '#777',
        fontSize: '14px',
        marginBottom: '8px'
    },
    statValue: {
        display: 'block',
        color: '#c0392b',
        fontSize: '32px'
    },
    cards: {
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap'
    },
    card: {
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '30px',
        fontSize: '18px',
        flex: '1',
        minWidth: '200px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        textAlign: 'center',
        cursor: 'pointer',
        maxWidth: '300px'
    }
}

export default Dashboard