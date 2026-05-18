const prisma = require('../prisma')

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

        if (!name || !address || !type) {
            return res.status(400).json({ message: 'Заполните все обязательные поля' })
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
                name,
                address,

                latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
                longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,

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

        res.status(201).json(serializeObject(object))
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const update = async (req, res) => {
    try {
        const { name, address, type, riskLevel, latitude, longitude } = req.body

        if (!name || !address || !type) {
            return res.status(400).json({ message: 'Заполните все обязательные поля' })
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
                name,
                address,

                latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
                longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,

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

        res.json(serializeObject(object))
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const remove = async (req, res) => {
    try {
        await prisma.fireObject.delete({
            where: {
                id: Number(req.params.id)
            }
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