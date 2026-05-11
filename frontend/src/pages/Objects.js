import { useState, useEffect, useCallback } from 'react' 
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Objects() {
  const [objects, setObjects] = useState([])
  const [form, setForm] = useState({ name: '', address: '', type: '', riskLevel: 'LOW' })
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [filterRisk, setFilterRisk] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const navigate = useNavigate()

  const fetchObjects = useCallback(async () => {
    try {
      const params = { page, limit: 5 }
      if (filterRisk) params.riskLevel = filterRisk
      if (filterType) params.type = filterType
      
      const res = await api.get('/objects', { params })
      setObjects(res.data.objects)
      setTotalPages(res.data.pages)
    } catch (err) {
      console.error('Ошибка при загрузке данных:', err)
      setError('Не удалось загрузить список объектов')
    }
  }, [page, filterRisk, filterType])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchObjects() }, [page, filterRisk, filterType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('Введите название объекта')
    if (!form.address.trim()) return setError('Введите адрес объекта')
    if (!form.type.trim()) return setError('Введите тип объекта')
    try {
      if (editId) {
        await api.put(`/objects/${editId}`, form)
      } else {
        await api.post('/objects', form)
      }
      setForm({ name: '', address: '', type: '', riskLevel: 'LOW' })
      setShowForm(false)
      setEditId(null)
      fetchObjects()
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка сервера')
    }
  }

  const handleEdit = (obj) => {
    setForm({ name: obj.name, address: obj.address, type: obj.type, riskLevel: obj.riskLevel })
    setEditId(obj.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Удалить объект?')) {
      try {
        await api.delete(`/objects/${id}`)
        fetchObjects()
      } catch (err) {
        setError('Ошибка при удалении')
      }
    }
  }

  const resetFilters = () => {
    setFilterRisk('')
    setFilterType('')
    setPage(1)
  }

  const riskColor = { LOW: '#27ae60', MEDIUM: '#f39c12', HIGH: '#e67e22', CRITICAL: '#c0392b' }
  const riskLabel = { LOW: 'Низкий', MEDIUM: 'Средний', HIGH: 'Высокий', CRITICAL: 'Критический' }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/')} style={styles.backBtn}>← Назад</button>

      <div style={styles.header}>
        <h2 style={styles.title}>Пожарные объекты</h2>
        <button style={styles.btn} onClick={() => {
          setShowForm(!showForm); setEditId(null)
          setForm({ name: '', address: '', type: '', riskLevel: 'LOW' })
        }}>
          {showForm ? 'Отмена' : '+ Добавить объект'}
        </button>
      </div>

      <div style={styles.filters}>
        <select style={styles.filterInput} value={filterRisk}
          onChange={e => { setFilterRisk(e.target.value); setPage(1) }}>
          <option value="">Все уровни риска</option>
          <option value="LOW">Низкий</option>
          <option value="MEDIUM">Средний</option>
          <option value="HIGH">Высокий</option>
          <option value="CRITICAL">Критический</option>
        </select>
        <input style={styles.filterInput} placeholder="Фильтр по типу..."
          value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }} />
        <button style={styles.resetBtn} onClick={resetFilters}>Сбросить</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3>{editId ? 'Редактировать объект' : 'Новый объект'}</h3>
          {error && <p style={styles.error}>{error}</p>}
          <input style={styles.input} placeholder="Название" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <input style={styles.input} placeholder="Адрес" value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })} />
          <input style={styles.input} placeholder="Тип (жилой, промышленный...)" value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })} />
          <select style={styles.input} value={form.riskLevel}
            onChange={e => setForm({ ...form, riskLevel: e.target.value })}>
            <option value="LOW">Низкий риск</option>
            <option value="MEDIUM">Средний риск</option>
            <option value="HIGH">Высокий риск</option>
            <option value="CRITICAL">Критический риск</option>
          </select>
          <button style={styles.btn} type="submit">{editId ? 'Сохранить' : 'Создать'}</button>
        </form>
      )}

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Название</th>
            <th style={styles.th}>Адрес</th>
            <th style={styles.th}>Тип</th>
            <th style={styles.th}>Уровень риска</th>
            <th style={styles.th}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {objects.map(obj => (
            <tr key={obj.id} style={styles.tr}>
              <td style={styles.td}>{obj.name}</td>
              <td style={styles.td}>{obj.address}</td>
              <td style={styles.td}>{obj.type}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, backgroundColor: riskColor[obj.riskLevel] }}>
                  {riskLabel[obj.riskLevel]}
                </span>
              </td>
              <td style={styles.td}>
                <button style={styles.editBtn} onClick={() => handleEdit(obj)}>Изменить</button>
                <button style={styles.deleteBtn} onClick={() => handleDelete(obj.id)}>Удалить</button>
              </td>
            </tr>
          ))}
          {objects.length === 0 && (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              Объекты не найдены
            </td></tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button style={styles.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 1}>
            Назад
          </button>
          <span style={styles.pageInfo}>Страница {page} из {totalPages}</span>
          <button style={styles.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
            Вперёд
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { padding: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { color: '#c0392b', margin: 0 },
  btn: { backgroundColor: '#c0392b', color: 'white', border: 'none', padding: '10px 20px',
    borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  filters: { display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' },
  filterInput: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' },
  resetBtn: { padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd',
    background: 'white', cursor: 'pointer', fontSize: '14px' },
  form: { background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px',
    border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white',
    borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' },
  thead: { backgroundColor: '#c0392b', color: 'white' },
  th: { padding: '12px 16px', textAlign: 'left' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px 16px' },
  badge: { color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' },
  editBtn: { background: '#f39c12', color: 'white', border: 'none', padding: '6px 12px',
    borderRadius: '4px', cursor: 'pointer', marginRight: '8px', fontSize: '13px' },
  deleteBtn: { background: '#c0392b', color: 'white', border: 'none', padding: '6px 12px',
    borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
  error: { color: 'red', marginBottom: '10px' },
  backBtn: { background: 'none', border: 'none', color: '#c0392b', fontSize: '16px',
    cursor: 'pointer', marginBottom: '16px', padding: 0, fontWeight: 'bold' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: '20px', marginTop: '20px' },
  pageBtn: { padding: '8px 20px', backgroundColor: '#c0392b', color: 'white',
    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  pageInfo: { fontSize: '14px', color: '#555' }
}

export default Objects