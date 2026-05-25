const prisma = require('../prisma')
const { writeAuditLog, getClientIp } = require('../services/auditService')
const { isValidEmail, isValidLogin } = require('../utils/validation')

const serializeUser = (user) => ({
    id: user.id,
    login: user.login,
    email: user.emailInfo?.email || '',
    role: user.role?.name || '',
    createdAt: user.createdAt
})

const roleLabels = {
    USER: 'Пользователь',
    SPECIALIST: 'Специалист',
    ADMIN: 'Администратор'
}

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

        if (login !== undefined && !isValidLogin(login)) {
            return res.status(400).json({
                message: 'Логин должен быть от 3 до 30 символов и содержать только латинские буквы, цифры или _'
            })
        }

        if (email !== undefined && !isValidEmail(email)) {
            return res.status(400).json({ message: 'Введите корректный email' })
        }

        const oldUser = await prisma.user.findUnique({
            where: {
                id
            },
            include: {
                emailInfo: true,
                role: true
            }
        })

        if (!oldUser) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }

        if (id === req.user.id && role !== undefined && role !== oldUser.role?.name) {
            await writeAuditLog({
                userId: req.user.id,
                action: 'SELF_ROLE_CHANGE_BLOCKED',
                entity: 'User',
                entityId: id,
                details: 'Попытка изменить собственную роль была заблокирована',
                ip: getClientIp(req)
            })

            return res.status(400).json({
                message: 'Нельзя изменить собственную роль'
            })
        }

        const updatedUser = await prisma.$transaction(async (tx) => {
            const userData = {}

            if (login !== undefined) {
                userData.login = login.trim()
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
                        email: email.trim()
                    },
                    create: {
                        userId: id,
                        email: email.trim()
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

        const changes = []

        if (oldUser.login !== updatedUser.login) {
            changes.push(`логин: ${oldUser.login} → ${updatedUser.login}`)
        }

        if ((oldUser.emailInfo?.email || '') !== (updatedUser.emailInfo?.email || '')) {
            changes.push(`email: ${oldUser.emailInfo?.email || '-'} → ${updatedUser.emailInfo?.email || '-'}`)
        }

        if ((oldUser.role?.name || '') !== (updatedUser.role?.name || '')) {
            changes.push(
                `роль: ${roleLabels[oldUser.role?.name] || oldUser.role?.name} → ${roleLabels[updatedUser.role?.name] || updatedUser.role?.name}`
            )
        }

        await writeAuditLog({
            userId: req.user.id,
            action: 'UPDATE_USER',
            entity: 'User',
            entityId: id,
            details: changes.length
                ? `Изменён пользователь ${updatedUser.login}. Изменения: ${changes.join('; ')}`
                : `Пользователь ${updatedUser.login} сохранён без изменений`,
            ip: getClientIp(req)
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
        const id = Number(req.params.id)
        if (id === req.user.id) {
            await writeAuditLog({
                userId: req.user.id,
                action: 'SELF_DELETE_BLOCKED',
                entity: 'User',
                entityId: id,
                details: 'Попытка удалить собственный аккаунт была заблокирована',
                ip: getClientIp(req)
            })

            return res.status(400).json({
                message: 'Нельзя удалить собственный аккаунт'
            })
        }

        const user = await prisma.user.findUnique({
            where: {
                id
            }
        })

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }

        await prisma.user.delete({
            where: {
                id
            }
        })

        await writeAuditLog({
            userId: req.user.id,
            action: 'DELETE_USER',
            entity: 'User',
            entityId: id,
            details: `Удалён пользователь: ${user.login}`,
            ip: getClientIp(req)
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