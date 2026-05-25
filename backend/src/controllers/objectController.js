const prisma = require('../prisma')
const { sendTelegramAlert } = require('../services/telegramService')
const { writeAuditLog, getClientIp } = require('../services/auditService')
const { isValidCoordinate } = require('../utils/validation')

const serializeObject = (obj) => ({
    id: obj.id,
    name: obj.name,
    address: obj.address,
    createdAt: obj.createdAt,

    latitude: obj.latitude,
    longitude: obj.longitude,

    type: obj.type?.name || '',
    riskLevel: obj.riskLevel?.code || '',
    riskLevelName: obj.riskLevel?.name || '',

    user: obj.user
})

const riskLabels = {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    HIGH: 'Высокий',
    CRITICAL: 'Критический'
}

const notifyDangerObject = (object, action) => {
    const riskCode = object.riskLevel?.code

    if (!['HIGH', 'CRITICAL'].includes(riskCode)) {
        return
    }

    const message =
        ` ${action} объект с высоким уровнем риска

Название: ${object.name}
Адрес: ${object.address}
Тип: ${object.type?.name || 'Не указан'}
Риск: ${object.riskLevel?.name || riskLabels[riskCode] || riskCode}
Пользователь: ${object.user?.login || 'Не указан'}`

    sendTelegramAlert(message)
}

const validateObjectInput = ({ name, address, type, riskLevel, latitude, longitude }) => {
    if (!name || !String(name).trim()) {
        return 'Введите название объекта'
    }

    if (!address || !String(address).trim()) {
        return 'Введите адрес объекта'
    }

    if (!type || !String(type).trim()) {
        return 'Введите тип объекта'
    }

    if (String(name).trim().length < 3) {
        return 'Название объекта должно быть не короче 3 символов'
    }

    if (String(address).trim().length < 5) {
        return 'Адрес объекта должен быть не короче 5 символов'
    }

    const allowedRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

    if (riskLevel && !allowedRiskLevels.includes(riskLevel)) {
        return 'Некорректный уровень риска'
    }

    if (!isValidCoordinate(latitude, -90, 90)) {
        return 'Некорректная широта'
    }

    if (!isValidCoordinate(longitude, -180, 180)) {
        return 'Некорректная долгота'
    }

    return null
}

const getAll = async (req, res) => {
    try {
        const { riskLevel, type, page = 1, limit = 10 } = req.query

        const where = {}

        if (riskLevel) {
            where.riskLevel = {
                code: riskLevel
            }
        }

        if (type) {
            where.type = {
                name: {
                    contains: type,
                    mode: 'insensitive'
                }
            }
        }

        const objects = await prisma.fireObject.findMany({
            where,
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
            include: {
                user: {
                    select: {
                        id: true,
                        login: true
                    }
                },
                type: true,
                riskLevel: true
            },
            orderBy: {
                id: 'asc'
            }
        })

        const total = await prisma.fireObject.count({ where })

        res.json({
            objects: objects.map(serializeObject),
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const getOne = async (req, res) => {
    try {
        const object = await prisma.fireObject.findUnique({
            where: {
                id: Number(req.params.id)
            },
            include: {
                user: {
                    select: {
                        id: true,
                        login: true
                    }
                },
                type: true,
                riskLevel: true
            }
        })

        if (!object) {
            return res.status(404).json({ message: 'Объект не найден' })
        }

        res.json(serializeObject(object))
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const create = async (req, res) => {
    try {
        const { name, address, type, riskLevel, latitude, longitude } = req.body

        const validationError = validateObjectInput({
            name,
            address,
            type,
            riskLevel,
            latitude,
            longitude
        })

        if (validationError) {
            return res.status(400).json({ message: validationError })
        }

        const riskCode = riskLevel || 'LOW'

        const typeRecord = await prisma.objectType.upsert({
            where: {
                name: type.trim()
            },
            update: {},
            create: {
                name: type.trim()
            }
        })

        const riskRecord = await prisma.riskLevel.findUnique({
            where: {
                code: riskCode
            }
        })

        if (!riskRecord) {
            return res.status(400).json({ message: 'Некорректный уровень риска' })
        }

        const object = await prisma.fireObject.create({
            data: {
                name: name.trim(),
                address: address.trim(),

                latitude: latitude !== undefined && latitude !== null && latitude !== ''
                    ? Number(latitude)
                    : null,

                longitude: longitude !== undefined && longitude !== null && longitude !== ''
                    ? Number(longitude)
                    : null,

                user: {
                    connect: {
                        id: req.user.id
                    }
                },
                type: {
                    connect: {
                        id: typeRecord.id
                    }
                },
                riskLevel: {
                    connect: {
                        id: riskRecord.id
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        login: true
                    }
                },
                type: true,
                riskLevel: true
            }
        })

        notifyDangerObject(object, 'Создан')

        await writeAuditLog({
            userId: req.user.id,
            action: 'CREATE_OBJECT',
            entity: 'FireObject',
            entityId: object.id,
            details: `Создан объект: ${object.name}, риск: ${riskLabels[object.riskLevel?.code] || object.riskLevel?.code}`,
            ip: getClientIp(req)
        })

        res.status(201).json(serializeObject(object))
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const update = async (req, res) => {
    try {
        const { name, address, type, riskLevel, latitude, longitude } = req.body

        const validationError = validateObjectInput({
            name,
            address,
            type,
            riskLevel,
            latitude,
            longitude
        })

        if (validationError) {
            return res.status(400).json({ message: validationError })
        }

        const riskCode = riskLevel || 'LOW'

        const typeRecord = await prisma.objectType.upsert({
            where: {
                name: type.trim()
            },
            update: {},
            create: {
                name: type.trim()
            }
        })

        const riskRecord = await prisma.riskLevel.findUnique({
            where: {
                code: riskCode
            }
        })

        if (!riskRecord) {
            return res.status(400).json({ message: 'Некорректный уровень риска' })
        }

        const object = await prisma.fireObject.update({
            where: {
                id: Number(req.params.id)
            },
            data: {
                name: name.trim(),
                address: address.trim(),

                latitude: latitude !== undefined && latitude !== null && latitude !== ''
                    ? Number(latitude)
                    : null,

                longitude: longitude !== undefined && longitude !== null && longitude !== ''
                    ? Number(longitude)
                    : null,

                type: {
                    connect: {
                        id: typeRecord.id
                    }
                },
                riskLevel: {
                    connect: {
                        id: riskRecord.id
                    }
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        login: true
                    }
                },
                type: true,
                riskLevel: true
            }
        })

        notifyDangerObject(object, 'Обновлён')

        await writeAuditLog({
            userId: req.user.id,
            action: 'UPDATE_OBJECT',
            entity: 'FireObject',
            entityId: object.id,
            details: `Обновлён объект: ${object.name}, риск: ${riskLabels[object.riskLevel?.code] || object.riskLevel?.code}`,
            ip: getClientIp(req)
        })

        res.json(serializeObject(object))
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const remove = async (req, res) => {
    try {
        const objectId = Number(req.params.id)

        const object = await prisma.fireObject.findUnique({
            where: {
                id: objectId
            }
        })

        await prisma.fireObject.delete({
            where: {
                id: objectId
            }
        })

        await writeAuditLog({
            userId: req.user.id,
            action: 'DELETE_OBJECT',
            entity: 'FireObject',
            entityId: objectId,
            details: `Удалён объект: ${object?.name || 'неизвестный объект'}`,
            ip: getClientIp(req)
        })

        res.json({ message: 'Объект удалён' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

module.exports = {
    getAll,
    getOne,
    create,
    update,
    remove
}