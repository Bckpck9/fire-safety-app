const prisma = require('../prisma')

const getAll = async (req, res) => {
  try {
    const { riskLevel, type, page = 1, limit = 10 } = req.query
    const where = {}
    if (riskLevel) where.riskLevel = riskLevel
    if (type) where.type = type

    const objects = await prisma.fireObject.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      include: { owner: { select: { id: true, login: true } } }
    })
    const total = await prisma.fireObject.count({ where })

    res.json({ objects, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

const getOne = async (req, res) => {
  try {
    const object = await prisma.fireObject.findUnique({
      where: { id: Number(req.params.id) },
      include: { reports: true, inspections: true, owner: { select: { id: true, login: true } } }
    })
    if (!object) return res.status(404).json({ message: 'Объект не найден' })
    res.json(object)
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

const create = async (req, res) => {
  try {
    const { name, address, type, riskLevel } = req.body
    if (!name || !address || !type) {
      return res.status(400).json({ message: 'Заполните все поля' })
    }
    const object = await prisma.fireObject.create({
      data: { name, address, type, riskLevel, ownerId: req.user.id }
    })
    res.status(201).json(object)
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

const update = async (req, res) => {
  try {
    const { name, address, type, riskLevel } = req.body
    const object = await prisma.fireObject.update({
      where: { id: Number(req.params.id) },
      data: { name, address, type, riskLevel }
    })
    res.json(object)
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

const remove = async (req, res) => {
  try {
    await prisma.fireObject.delete({ where: { id: Number(req.params.id) } })
    res.json({ message: 'Объект удалён' })
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

module.exports = { getAll, getOne, create, update, remove }