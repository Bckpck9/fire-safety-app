import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../api/axios'

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

function MapClickHandler({ onSelect }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng)
        }
    })

    return null
}

function MapCenterUpdater({ point }) {
    const map = useMap()

    useEffect(() => {
        if (point) {
            map.setView([point.lat, point.lng], 15)
        }
    }, [point, map])

    return null
}

function ObjectDetails() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [object, setObject] = useState(null)

    const [form, setForm] = useState({
        name: '',
        address: '',
        type: '',
        riskLevel: 'LOW'
    })

    const [threat, setThreat] = useState({
        people: '0',
        flammable: '0',
        evacuation: '0'
    })
    const [truckCalc, setTruckCalc] = useState({
        waterIntensity: '0.10',
        truckCapacity: '20'
    })

    const [mapPoint, setMapPoint] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [loading, setLoading] = useState(true)


    const riskColor = {
        LOW: '#27ae60',
        MEDIUM: '#f39c12',
        HIGH: '#e67e22',
        CRITICAL: '#c0392b'
    }

    const riskLabel = {
        LOW: 'Низкий',
        MEDIUM: 'Средний',
        HIGH: 'Высокий',
        CRITICAL: 'Критический'
    }

    const fetchObject = async () => {
        try {
            setLoading(true)
            setError('')
            setNotice('')

            const res = await api.get(`/objects/${id}`)

            setObject(res.data)

            setForm({
                name: res.data.name || '',
                address: res.data.address || '',
                type: res.data.type || '',
                riskLevel: res.data.riskLevel || 'LOW'
            })

            if (res.data.latitude !== null && res.data.latitude !== undefined &&
                res.data.longitude !== null && res.data.longitude !== undefined) {
                setMapPoint({
                    lat: Number(res.data.latitude),
                    lng: Number(res.data.longitude)
                })
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось загрузить карточку объекта')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchObject()
    }, [id])

    const calculateFireTrucks = () => {
        const fireAreaByRisk = {
            LOW: 50,
            MEDIUM: 100,
            HIGH: 200,
            CRITICAL: 500
        }

        const fireArea = fireAreaByRisk[object.riskLevel] || 50
        const waterIntensity = Number(truckCalc.waterIntensity)
        const truckCapacity = Number(truckCalc.truckCapacity)

        if (!waterIntensity || !truckCapacity || waterIntensity <= 0 || truckCapacity <= 0) {
            return {
                fireArea,
                waterIntensity: 0,
                requiredWaterFlow: 0,
                trucks: 1
            }
        }

        const requiredWaterFlow = fireArea * waterIntensity
        const trucks = Math.max(1, Math.ceil(requiredWaterFlow / truckCapacity))

        return {
            fireArea,
            waterIntensity,
            requiredWaterFlow: Math.round(requiredWaterFlow * 10) / 10,
            trucks
        }
    }

    const calculateRisk = () => {
        const score =
            Number(threat.people) +
            Number(threat.flammable) +
            Number(threat.evacuation)

        if (score >= 6) {
            return {
                code: 'CRITICAL',
                label: 'Критический',
                score
            }
        }

        if (score >= 4) {
            return {
                code: 'HIGH',
                label: 'Высокий',
                score
            }
        }

        if (score >= 2) {
            return {
                code: 'MEDIUM',
                label: 'Средний',
                score
            }
        }

        return {
            code: 'LOW',
            label: 'Низкий',
            score
        }
    }

    const formatShortAddress = (data) => {
        const address = data.address || {}

        const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county ||
            address.state ||
            ''

        const street =
            address.road ||
            address.pedestrian ||
            address.footway ||
            address.residential ||
            address.street ||
            ''

        const houseNumber = address.house_number || ''

        if (city && street && houseNumber) {
            return `${city}, ${street} ${houseNumber}`
        }

        if (city && street) {
            return `${city}, ${street}`
        }

        return null
    }

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    const handleUpdate = async (e) => {
        e.preventDefault()
        setError('')
        setNotice('')

        if (!form.name.trim()) {
            return setError('Введите название объекта')
        }

        if (!form.address.trim()) {
            return setError('Введите адрес объекта')
        }

        if (!form.type.trim()) {
            return setError('Введите тип объекта')
        }

        try {
            const res = await api.put(`/objects/${id}`, {
                ...form,
                latitude: object.latitude,
                longitude: object.longitude
            })

            setObject(res.data)
            setIsEditing(false)

            setForm({
                name: res.data.name || '',
                address: res.data.address || '',
                type: res.data.type || '',
                riskLevel: res.data.riskLevel || 'LOW'
            })
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при обновлении объекта')
        }
    }

    const handleDelete = async () => {
        const confirmed = window.confirm('Вы уверены, что хотите удалить этот объект?')

        if (!confirmed) {
            return
        }

        try {
            await api.delete(`/objects/${id}`)
            navigate('/objects')
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка при удалении объекта')
        }
    }

    const handleMapSelect = async (latlng) => {
        try {
            setError('')
            setNotice('')

            const lat = latlng.lat
            const lng = latlng.lng

            setMapPoint({
                lat,
                lng
            })

            let newAddress = object.address

            try {
                const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`
                const response = await fetch(reverseUrl)

                if (response.ok) {
                    const data = await response.json()
                    const formattedAddress = formatShortAddress(data)

                    if (formattedAddress) {
                        newAddress = formattedAddress
                    } else {
                        setNotice('Точка сохранена, но город/улица/дом не определились. Старый адрес оставлен.')
                    }
                } else {
                    setNotice('Точка сохранена, но адрес определить не удалось. Старый адрес оставлен.')
                }
            } catch (geoError) {
                setNotice('Точка сохранена, но адрес определить не удалось. Старый адрес оставлен.')
            }

            const res = await api.put(`/objects/${id}`, {
                name: object.name,
                address: newAddress,
                type: object.type,
                riskLevel: object.riskLevel,
                latitude: lat,
                longitude: lng
            })

            setObject(res.data)

            setForm({
                name: res.data.name || '',
                address: res.data.address || '',
                type: res.data.type || '',
                riskLevel: res.data.riskLevel || 'LOW'
            })
        } catch (err) {
            console.error(err)
            setError(err.response?.data?.message || 'Не удалось сохранить выбранную точку')
        }
    }

    const applyCalculatedRisk = async () => {
        if (!object) {
            return
        }

        const result = calculateRisk()
        const confirmed = window.confirm(`Применить уровень риска: ${result.label}?`)

        if (!confirmed) {
            return
        }

        try {
            setError('')
            setNotice('')

            const res = await api.put(`/objects/${id}`, {
                name: object.name,
                address: object.address,
                type: object.type,
                riskLevel: result.code,
                latitude: object.latitude,
                longitude: object.longitude
            })

            setObject(res.data)

            setForm({
                name: res.data.name || '',
                address: res.data.address || '',
                type: res.data.type || '',
                riskLevel: res.data.riskLevel || 'LOW'
            })
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось применить уровень риска')
        }
    }

    const cancelEdit = () => {
        if (object) {
            setForm({
                name: object.name || '',
                address: object.address || '',
                type: object.type || '',
                riskLevel: object.riskLevel || 'LOW'
            })
        }

        setIsEditing(false)
        setError('')
        setNotice('')
    }

    if (loading) {
        return (
            <div style={styles.container}>
                <button onClick={() => navigate('/objects')} style={styles.backBtn}>
                    ← Назад к объектам
                </button>

                <p>Загрузка карточки объекта...</p>
            </div>
        )
    }

    if (error && !object) {
        return (
            <div style={styles.container}>
                <button onClick={() => navigate('/objects')} style={styles.backBtn}>
                    ← Назад к объектам
                </button>

                <p style={styles.error}>{error}</p>
            </div>
        )
    }

    if (!object) {
        return (
            <div style={styles.container}>
                <button onClick={() => navigate('/objects')} style={styles.backBtn}>
                    ← Назад к объектам
                </button>

                <p>Объект не найден</p>
            </div>
        )
    }

    const calculatedRisk = calculateRisk()
    const defaultCenter = [55.751244, 37.618423]
    const fireTruckResult = calculateFireTrucks()

    return (
        <div style={styles.container}>
            <button onClick={() => navigate('/objects')} style={styles.backBtn}>
                ← Назад к объектам
            </button>

            <div style={styles.card}>
                <div style={styles.header}>
                    <div>
                        <h2 style={styles.title}>{object.name}</h2>
                        <p style={styles.subtitle}>Карточка пожарного объекта №{object.id}</p>
                    </div>

                    <div style={styles.headerActions}>
                        <span
                            style={{
                                ...styles.badge,
                                backgroundColor: riskColor[object.riskLevel] || '#777'
                            }}
                        >
                            {object.riskLevelName || riskLabel[object.riskLevel] || object.riskLevel}
                        </span>

                        {!isEditing && (
                            <div style={styles.buttons}>
                                <button style={styles.editBtn} onClick={() => setIsEditing(true)}>
                                    Изменить
                                </button>

                                <button style={styles.deleteBtn} onClick={handleDelete}>
                                    Удалить
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {error && <p style={styles.error}>{error}</p>}
                {notice && <p style={styles.notice}>{notice}</p>}

                {isEditing ? (
                    <form onSubmit={handleUpdate} style={styles.form}>
                        <h3 style={styles.formTitle}>Редактирование объекта</h3>

                        <input
                            style={styles.input}
                            name="name"
                            placeholder="Название"
                            value={form.name}
                            onChange={handleChange}
                        />

                        <input
                            style={styles.input}
                            name="address"
                            placeholder="Адрес"
                            value={form.address}
                            onChange={handleChange}
                        />

                        <input
                            style={styles.input}
                            name="type"
                            placeholder="Тип объекта"
                            value={form.type}
                            onChange={handleChange}
                        />

                        <select
                            style={styles.input}
                            name="riskLevel"
                            value={form.riskLevel}
                            onChange={handleChange}
                        >
                            <option value="LOW">Низкий риск</option>
                            <option value="MEDIUM">Средний риск</option>
                            <option value="HIGH">Высокий риск</option>
                            <option value="CRITICAL">Критический риск</option>
                        </select>

                        <div style={styles.formButtons}>
                            <button style={styles.saveBtn} type="submit">
                                Сохранить
                            </button>

                            <button style={styles.cancelBtn} type="button" onClick={cancelEdit}>
                                Отмена
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div style={styles.infoGrid}>
                            <div style={styles.infoBlock}>
                                <span style={styles.label}>Адрес</span>
                                <strong style={styles.value}>{object.address}</strong>
                            </div>

                            <div style={styles.infoBlock}>
                                <span style={styles.label}>Тип объекта</span>
                                <strong style={styles.value}>{object.type}</strong>
                            </div>

                            <div style={styles.infoBlock}>
                                <span style={styles.label}>Уровень риска</span>
                                <strong style={styles.value}>
                                    {object.riskLevelName || riskLabel[object.riskLevel] || object.riskLevel}
                                </strong>
                            </div>

                            <div style={styles.infoBlock}>
                                <span style={styles.label}>Создал пользователь</span>
                                <strong style={styles.value}>
                                    {object.user?.login || 'Не указан'}
                                </strong>
                            </div>

                            <div style={styles.infoBlock}>
                                <span style={styles.label}>Дата создания</span>
                                <strong style={styles.value}>
                                    {object.createdAt
                                        ? new Date(object.createdAt).toLocaleString('ru-RU')
                                        : 'Не указана'}
                                </strong>
                            </div>
                        </div>
                        <div style={styles.infoBlock}>
                            <span style={styles.label}>Уровень риска</span>
                            <strong style={styles.value}>
                                {object.riskLevelName || riskLabel[object.riskLevel] || object.riskLevel}
                            </strong>
                        </div>

                        <div style={styles.infoBlock}>
                            <span style={styles.label}>Рекомендуемое количество пожарных машин</span>
                            <strong style={styles.value}>{fireTruckResult.trucks}</strong>
                        </div>

                        <div style={styles.mapBlock}>
                            <div style={styles.mapHeader}>
                                <div>
                                    <h3 style={styles.mapTitle}>Карта объекта</h3>
                                    <p style={styles.mapText}>
                                        Нажмите на карту, чтобы поставить точку и обновить адрес объекта.
                                    </p>
                                    <p style={styles.mapText}>
                                        Текущий адрес: {object.address}
                                    </p>
                                </div>
                            </div>

                            <MapContainer
                                center={mapPoint ? [mapPoint.lat, mapPoint.lng] : defaultCenter}
                                zoom={mapPoint ? 15 : 10}
                                style={styles.leafletMap}
                            >
                                <TileLayer
                                    attribution='&copy; OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                <MapClickHandler onSelect={handleMapSelect} />
                                <MapCenterUpdater point={mapPoint} />

                                {mapPoint && (
                                    <Marker position={[mapPoint.lat, mapPoint.lng]} />
                                )}
                            </MapContainer>
                        </div>

                        <div style={styles.calculator}>
                            <h3 style={styles.calcTitle}>Калькулятор уровня угрозы</h3>

                            <p style={styles.calcText}>
                                Выберите три параметра, система посчитает балл угрозы и предложит уровень риска.
                            </p>

                            <div style={styles.calcGrid}>
                                <div>
                                    <label style={styles.label}>Количество людей</label>
                                    <select
                                        style={styles.input}
                                        value={threat.people}
                                        onChange={e => setThreat({ ...threat, people: e.target.value })}
                                    >
                                        <option value="0">Мало людей</option>
                                        <option value="1">Среднее количество</option>
                                        <option value="2">Много людей</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={styles.label}>Горючие материалы</label>
                                    <select
                                        style={styles.input}
                                        value={threat.flammable}
                                        onChange={e => setThreat({ ...threat, flammable: e.target.value })}
                                    >
                                        <option value="0">Почти нет</option>
                                        <option value="1">Есть умеренно</option>
                                        <option value="2">Много</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={styles.label}>Сложность эвакуации</label>
                                    <select
                                        style={styles.input}
                                        value={threat.evacuation}
                                        onChange={e => setThreat({ ...threat, evacuation: e.target.value })}
                                    >
                                        <option value="0">Простая</option>
                                        <option value="1">Средняя</option>
                                        <option value="2">Сложная</option>
                                    </select>
                                </div>
                            </div>

                            <div style={styles.calcResult}>
                                <div>
                                    <span style={styles.label}>Балл угрозы</span>
                                    <strong style={styles.value}>{calculatedRisk.score}</strong>
                                </div>

                                <div>
                                    <span style={styles.label}>Рассчитанный уровень</span>
                                    <strong style={styles.value}>{calculatedRisk.label}</strong>
                                </div>

                                <button style={styles.applyBtn} onClick={applyCalculatedRisk}>
                                    Применить к объекту
                                </button>
                            </div>
                        </div>
                        <div style={styles.calculator}>
                            <h3 style={styles.calcTitle}>Расчёт количества пожарных машин</h3>

                            <p style={styles.calcText}>
                                Расчёт выполняется по упрощённой модели на основе интенсивности подачи воды
                                и расчётной площади пожара. Требуемый расход воды определяется по формуле
                                Q = F × J, затем делится на подачу одной пожарной машины.
                            </p>

                            <div style={styles.calcGrid}>
                                <div>
                                    <label style={styles.label}>Тип объекта / интенсивность подачи воды J</label>
                                    <select
                                        style={styles.input}
                                        value={truckCalc.waterIntensity}
                                        onChange={e => setTruckCalc({ ...truckCalc, waterIntensity: e.target.value })}
                                    >
                                        <option value="0.09">Жилой объект — 0.09 л/(м²·с)</option>
                                        <option value="0.10">Общественный объект — 0.10 л/(м²·с)</option>
                                        <option value="0.15">Склад — 0.15 л/(м²·с)</option>
                                        <option value="0.13">Промышленный объект — 0.13 л/(м²·с)</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={styles.label}>Подача одной пожарной машины, л/с</label>
                                    <input
                                        style={styles.input}
                                        type="number"
                                        min="1"
                                        value={truckCalc.truckCapacity}
                                        onChange={e => setTruckCalc({ ...truckCalc, truckCapacity: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={styles.calcResult}>
                                <div>
                                    <span style={styles.label}>Расчётная площадь пожара F</span>
                                    <strong style={styles.value}>{fireTruckResult.fireArea} м²</strong>
                                </div>

                                <div>
                                    <span style={styles.label}>Интенсивность подачи воды J</span>
                                    <strong style={styles.value}>{fireTruckResult.waterIntensity} л/(м²·с)</strong>
                                </div>

                                <div>
                                    <span style={styles.label}>Требуемый расход воды Q</span>
                                    <strong style={styles.value}>{fireTruckResult.requiredWaterFlow} л/с</strong>
                                </div>

                                <div>
                                    <span style={styles.label}>Рекомендуемое количество машин</span>
                                    <strong style={styles.value}>{fireTruckResult.trucks}</strong>
                                </div>

                                <div>
                                    <span style={styles.label}>Формула</span>
                                    <strong style={styles.value}>
                                        ceil(({fireTruckResult.fireArea} × {fireTruckResult.waterIntensity}) / {truckCalc.truckCapacity})
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const styles = {
    container: {
        padding: '40px',
        backgroundColor: '#f5f5f5',
        minHeight: 'calc(100vh - 60px)'
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
    card: {
        background: 'white',
        borderRadius: '12px',
        padding: '28px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '1100px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px',
        borderBottom: '1px solid #eee',
        paddingBottom: '20px',
        marginBottom: '24px'
    },
    headerActions: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '14px'
    },
    title: {
        color: '#c0392b',
        margin: 0,
        fontSize: '28px'
    },
    subtitle: {
        color: '#777',
        marginTop: '8px',
        marginBottom: 0
    },
    badge: {
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        whiteSpace: 'nowrap'
    },
    buttons: {
        display: 'flex',
        gap: '8px'
    },
    editBtn: {
        background: '#f39c12',
        color: 'white',
        border: 'none',
        padding: '8px 14px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    deleteBtn: {
        background: '#c0392b',
        color: 'white',
        border: 'none',
        padding: '8px 14px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '18px'
    },
    infoBlock: {
        border: '1px solid #eee',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#fafafa'
    },
    label: {
        display: 'block',
        color: '#777',
        fontSize: '13px',
        marginBottom: '6px'
    },
    value: {
        display: 'block',
        color: '#333',
        fontSize: '16px'
    },
    form: {
        background: '#fafafa',
        border: '1px solid #eee',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px'
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
    error: {
        color: 'red',
        marginBottom: '16px'
    },
    notice: {
        color: '#777',
        background: '#f7f7f7',
        border: '1px solid #ddd',
        borderRadius: '6px',
        padding: '10px 12px',
        marginBottom: '16px'
    },
    mapBlock: {
        marginTop: '28px',
        paddingTop: '24px',
        borderTop: '1px solid #eee'
    },
    mapHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '14px',
        flexWrap: 'wrap'
    },
    mapTitle: {
        color: '#c0392b',
        margin: 0,
        marginBottom: '6px'
    },
    mapText: {
        color: '#777',
        margin: 0
    },
    leafletMap: {
        width: '100%',
        height: '380px',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #ddd',
        boxShadow: '0 1px 5px rgba(0,0,0,0.12)'
    },
    calculator: {
        marginTop: '28px',
        paddingTop: '24px',
        borderTop: '1px solid #eee'
    },
    calcTitle: {
        color: '#c0392b',
        marginTop: 0,
        marginBottom: '8px'
    },
    calcText: {
        color: '#777',
        marginTop: 0,
        marginBottom: '18px'
    },
    calcGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
    },
    calcResult: {
        marginTop: '18px',
        padding: '16px',
        border: '1px solid #eee',
        borderRadius: '8px',
        backgroundColor: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap'
    },
    applyBtn: {
        background: '#c0392b',
        color: 'white',
        border: 'none',
        padding: '10px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold'
    }
}

export default ObjectDetails