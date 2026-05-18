import axios from 'axios'

const instance = axios.create({
    baseURL: 'http://localhost:4000/api'
})
//интерцептор перед каждым запросом на сервер автоматически добавляет токен в заголовки
//срабатывает перед тем как запрос уйдет на сервер
instance.interceptors.request.use((config) => {
    //достаем токен из локального хранилища браузера
    const token = localStorage.getItem('token')
    //если токен есть, добавляем его в заголовки запроса
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})
//интерцептор если токен недействителей, выкидываем пользователя на страницу входа
//срабатывает после того как пришел ответа от сервера
instance.interceptors.response.use(
    //вовзращаем ответ дальше
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            //удаляем недействительный токе
            localStorage.removeItem('token')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default instance