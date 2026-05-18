const jwt = require('jsonwebtoken')

//Middleware для проверки авторизации пользователя
const authMiddleware = (req, res, next) => {

    //извлекаем заголовок Authorization из входящего запроса
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {//присутсвует ли заголовок и начинается ли он с bearer
        return res.status(401).json({ message: 'Нет токена авторизации' })
    }
    //обрезаем строку 'Bearer ', чтобы получить чистый JWT токен
    const token = authHeader.split(' ')[1]

    try {
        //верифицируем токен с помощью секретного ключа из .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        //если проверка прошла успешно записываем расшифрованные данные (payload) в req.user
        req.user = decoded
        next()
    } catch (err) {
        return res.status(401).json({ message: 'Токен недействителен' })
    }
}

module.exports = authMiddleware