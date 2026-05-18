const express = require('express')
const cors = require('cors')
require('dotenv').config()
const authRoutes = require('./routes/authRoutes')
const objectRoutes = require('./routes/objectRoutes')
const userRoutes = require('./routes/userRoutes')


const app = express()

app.use(cors())//разрешение на общение между беком и фронтом
app.use(express.json())//парсер json чтоы сервер понимал json данные в теле запроса


app.use('/api/auth', authRoutes)
app.use('/api/objects', objectRoutes)
app.use('/api/users', userRoutes)

//если произошла ошибка в каком то контроллере
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Внутренняя ошибка сервера' })
})

//используем порт 4000
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`)
})