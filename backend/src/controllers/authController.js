const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')

const register = async (req, res) => {
  const { email, login, password } = req.body

  if (!email || !login || !password) {
    return res.status(400).json({ message: 'Заполните все поля' })
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { login }] }
    })

    if (existingUser) {
      return res.status(409).json({ message: 'Пользователь уже существует' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, login, password: hashedPassword }
    })

    res.status(201).json({ message: 'Пользователь зарегистрирован', userId: user.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

const loginUser = async (req, res) => {
  const { login: userLogin, password } = req.body

  if (!userLogin || !password) {
    return res.status(400).json({ message: 'Заполните все поля' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { login: userLogin } })

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный пароль' })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({ token, user: { id: user.id, login: user.login, email: user.email, role: user.role } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, login: true, email: true, role: true, createdAt: true }
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

module.exports = { register, login: loginUser, getMe }