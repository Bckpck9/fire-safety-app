const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')

const serializeUser = (user) => ({
    id: user.id,
    login: user.login,
    email: user.emailInfo?.email || '',
    role: user.role?.name || ''
})

const login = async (req, res) => {
    const { login: userLogin, password } = req.body

    if (!userLogin || !password) {
        return res.status(400).json({ message: 'Заполните все поля' })
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                login: userLogin
            },
            include: {
                passwordInfo: true,
                emailInfo: true,
                role: true
            }
        })

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' })
        }

        if (!user.passwordInfo) {
            return res.status(401).json({ message: 'У пользователя не настроен пароль' })
        }

        const isMatch = await bcrypt.compare(password, user.passwordInfo.passwordHash)

        if (!isMatch) {
            return res.status(401).json({ message: 'Неверный пароль' })
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        )

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
            where: {
                id: req.user.id
            },
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

module.exports = {
    login,
    getMe
}