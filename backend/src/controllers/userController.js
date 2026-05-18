const prisma = require('../prisma')

const serializeUser = (user) => ({
    id: user.id,
    login: user.login,
    email: user.emailInfo?.email || '',
    role: user.role?.name || '',
    createdAt: user.createdAt
})

const getAll = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                emailInfo: true,
                role: true
            },
            orderBy: {
                id: 'asc'
            }
        })

        res.json(users.map(serializeUser))
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const update = async (req, res) => {
    try {
        const id = Number(req.params.id)
        const { login, email, role } = req.body

        const updatedUser = await prisma.$transaction(async (tx) => {
            const userData = {}

            if (login !== undefined) {
                userData.login = login
            }

            if (role !== undefined) {
                const roleRecord = await tx.role.findUnique({
                    where: {
                        name: role
                    }
                })

                if (!roleRecord) {
                    throw new Error('ROLE_NOT_FOUND')
                }

                userData.role = {
                    connect: {
                        id: roleRecord.id
                    }
                }
            }

            await tx.user.update({
                where: {
                    id
                },
                data: userData
            })

            if (email !== undefined) {
                await tx.userEmail.upsert({
                    where: {
                        userId: id
                    },
                    update: {
                        email
                    },
                    create: {
                        userId: id,
                        email
                    }
                })
            }

            return tx.user.findUnique({
                where: {
                    id
                },
                include: {
                    emailInfo: true,
                    role: true
                }
            })
        })

        res.json(serializeUser(updatedUser))
    } catch (err) {
        console.error(err)

        if (err.message === 'ROLE_NOT_FOUND') {
            return res.status(400).json({ message: 'Некорректная роль пользователя' })
        }

        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const remove = async (req, res) => {
    try {
        await prisma.user.delete({
            where: {
                id: Number(req.params.id)
            }
        })

        res.json({ message: 'Пользователь удалён' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

module.exports = {
    getAll,
    update,
    remove
}