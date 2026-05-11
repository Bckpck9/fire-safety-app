const prisma = require('../prisma')

//получить всех пользователей — только ADMIN
const getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, login: true, email: true, role: true, createdAt: true }
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

//изменить роль пользователя — только ADMIN
const updateRole = async (req, res) => {
  try {
    const { role } = req.body
    const validRoles = ['USER', 'INSPECTOR', 'ADMIN']

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' })
    }

    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { role },
      select: { id: true, login: true, email: true, role: true }
    })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

//удалить пользователя — только ADMIN
const remove = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Пользователь удалён' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

module.exports = { getAll, updateRole, remove }