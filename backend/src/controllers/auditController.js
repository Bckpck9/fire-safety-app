const prisma = require('../prisma')

const getAll = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const { action } = req.query

        const skip = (page - 1) * limit

        const where = {}

        if (action) {
            where.action = action
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            login: true
                        }
                    }
                }
            }),

            prisma.auditLog.count({ where })
        ])

        res.json({
            logs,
            total,
            page,
            pages: Math.ceil(total / limit)
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка загрузки журнала действий' })
    }
}

module.exports = {
    getAll
}