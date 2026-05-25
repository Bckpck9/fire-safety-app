const express = require('express')
const cors = require('cors')
require('dotenv').config()
const authRoutes = require('./routes/authRoutes')
const objectRoutes = require('./routes/objectRoutes')
const userRoutes = require('./routes/userRoutes')
const auditRoutes = require('./routes/auditRoutes')
const prisma = require('./prisma')



const app = express()

app.use(cors())//разрешение на общение между беком и фронтом
app.use(express.json())//парсер json чтоы сервер понимал json данные в теле запроса


app.use('/api/auth', authRoutes)
app.use('/api/objects', objectRoutes)
app.use('/api/users', userRoutes)
app.use('/api/audit-log', auditRoutes)

//если произошла ошибка в каком то контроллере
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Внутренняя ошибка сервера' })
})

const initRoles = async () => {
  const roles = [
    {
      name: 'USER',
      description: 'Обычный пользователь'
    },
    {
      name: 'SPECIALIST',
      description: 'Специалист пожарной безопасности'
    },
    {
      name: 'ADMIN',
      description: 'Администратор системы'
    }
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        name: role.name
      },
      update: {
        description: role.description
      },
      create: role
    })
  }

  console.log('Роли проверены и созданы при необходимости')
}

//используем порт 4000
const PORT = process.env.PORT || 4001

initRoles()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Ошибка инициализации ролей:', err)
    process.exit(1)
  })