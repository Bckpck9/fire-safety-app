const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')
const { sendTelegramAlert } = require('../services/telegramService')
const { writeAuditLog, getClientIp } = require('../services/auditService')
const { isValidEmail, isValidLogin } = require('../utils/validation')

const twoFactorCodes = new Map()

const serializeUser = (user) => ({
    id: user.id,
    login: user.login,
    email: user.emailInfo?.email || '',
    role: user.role?.name || ''
})

const generateCode = () => {
    return String(Math.floor(100000 + Math.random() * 900000))
}

const register = async (req, res) => {
    try {
        const { login, email, password } = req.body

        if (!login || !email || !password) {
            return res.status(400).json({ message: 'Заполните все поля' })
        }
        if (!isValidLogin(login)) {
            return res.status(400).json({
                message: 'Логин должен быть от 3 до 30 символов и содержать только латинские буквы, цифры или _'
            })
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Введите корректный email' })
        }

        if (password.length < 5) {
            return res.status(400).json({ message: 'Пароль должен быть не короче 5 символов' })
        }

        const existingUser = await prisma.user.findUnique({ where: { login } })

        if (existingUser) {
            return res.status(409).json({ message: 'Пользователь с таким логином уже существует' })
        }

        const existingEmail = await prisma.userEmail.findUnique({ where: { email } })

        if (existingEmail) {
            return res.status(409).json({ message: 'Пользователь с такой почтой уже существует' })
        }

        const userRole = await prisma.role.findUnique({ where: { name: 'USER' } })

        if (!userRole) {
            return res.status(500).json({ message: 'Роль USER не найдена в базе данных' })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                login,
                role: { connect: { id: userRole.id } },
                emailInfo: { create: { email } },
                passwordInfo: { create: { passwordHash } }
            },
            include: {
                emailInfo: true,
                role: true
            }
        })

        await writeAuditLog({
            userId: user.id,
            action: 'REGISTER',
            entity: 'User',
            entityId: user.id,
            details: `Зарегистрирован пользователь ${user.login}`,
            ip: getClientIp(req)
        })

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: serializeUser(user)
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const login = async (req, res) => {
    const { login: userLogin, password } = req.body

    if (!userLogin || !password) {
        return res.status(400).json({ message: 'Заполните все поля' })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { login: userLogin },
            include: {
                passwordInfo: true,
                emailInfo: true,
                role: true
            }
        })

        if (!user) {
            await writeAuditLog({
                action: 'LOGIN_FAILED',
                entity: 'User',
                details: `Попытка входа с несуществующим логином: ${userLogin}`,
                ip: getClientIp(req)
            })

            return res.status(404).json({ message: 'Пользователь не найден' })
        }

        if (!user.passwordInfo) {
            return res.status(401).json({ message: 'Пароль пользователя не найден' })
        }

        const isMatch = await bcrypt.compare(password, user.passwordInfo.passwordHash)

        if (!isMatch) {
            await writeAuditLog({
                userId: user.id,
                action: 'LOGIN_FAILED',
                entity: 'User',
                entityId: user.id,
                details: `Неверный пароль для пользователя ${user.login}`,
                ip: getClientIp(req)
            })

            return res.status(401).json({ message: 'Неверный пароль' })
        }

        const code = generateCode()

        const tempToken = jwt.sign(
            {
                id: user.id,
                type: '2FA'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1m' }
        )

        twoFactorCodes.set(user.id, {
            code,
            expiresAt: Date.now() + 5 * 60 * 1000
        })

        await writeAuditLog({
            userId: user.id,
            action: 'LOGIN_PASSWORD_SUCCESS',
            entity: 'User',
            entityId: user.id,
            details: `Пользователь ${user.login} успешно ввёл логин и пароль, требуется 2FA`,
            ip: getClientIp(req)
        })

        await sendTelegramAlert(
            `Код двухфакторной аутентификации

Пользователь: ${user.login}
Код: ${code}

Код действует 1 минуту.`
        )

        res.json({
            requires2FA: true,
            tempToken,
            message: 'Код подтверждения отправлен в Telegram'
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const verify2FA = async (req, res) => {
    try {
        const { tempToken, code } = req.body

        if (!tempToken || !code) {
            return res.status(400).json({ message: 'Введите код подтверждения' })
        }

        let payload

        try {
            payload = jwt.verify(tempToken, process.env.JWT_SECRET)
        } catch (err) {
            await writeAuditLog({
                action: '2FA_FAILED',
                entity: 'Auth',
                details: 'Недействительный или истёкший временный токен 2FA',
                ip: getClientIp(req)
            })

            return res.status(401).json({ message: 'Временный токен недействителен или истёк' })
        }

        if (payload.type !== '2FA') {
            return res.status(401).json({ message: 'Некорректный тип токена' })
        }

        const savedCode = twoFactorCodes.get(payload.id)

        if (!savedCode) {
            return res.status(401).json({ message: 'Код не найден или истёк' })
        }

        if (Date.now() > savedCode.expiresAt) {
            twoFactorCodes.delete(payload.id)

            await writeAuditLog({
                userId: payload.id,
                action: '2FA_FAILED',
                entity: 'User',
                entityId: payload.id,
                details: 'Истёк срок действия 2FA-кода',
                ip: getClientIp(req)
            })

            return res.status(401).json({ message: 'Срок действия кода истёк' })
        }

        if (savedCode.code !== String(code).trim()) {
            await writeAuditLog({
                userId: payload.id,
                action: '2FA_FAILED',
                entity: 'User',
                entityId: payload.id,
                details: 'Введён неверный 2FA-код',
                ip: getClientIp(req)
            })

            return res.status(401).json({ message: 'Неверный код подтверждения' })
        }

        twoFactorCodes.delete(payload.id)

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            include: {
                emailInfo: true,
                role: true
            }
        })

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role?.name || 'USER'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        )

        await writeAuditLog({
            userId: user.id,
            action: 'LOGIN_SUCCESS',
            entity: 'User',
            entityId: user.id,
            details: `Пользователь ${user.login} успешно прошёл 2FA и вошёл в систему`,
            ip: getClientIp(req)
        })

        res.json({
            token,
            user: serializeUser(user)
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                emailInfo: true,
                role: true
            }
        })

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }

        res.json(serializeUser(user))
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

const logout = async (req, res) => {
    try {
        await writeAuditLog({
            userId: req.user.id,
            action: 'LOGOUT',
            entity: 'Auth',
            entityId: req.user.id,
            details: 'Пользователь вышел из системы',
            ip: getClientIp(req)
        })

        res.json({ message: 'Выход выполнен' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Ошибка сервера' })
    }
}

module.exports = {
    register,
    login,
    verify2FA,
    getMe,
    logout
}