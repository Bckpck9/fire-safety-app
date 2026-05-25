const router = require('express').Router()
const { register, login, verify2FA, getMe, logout } = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/register', register)
router.post('/login', login)
router.post('/verify-2fa', verify2FA)
router.get('/me', authMiddleware, getMe)
router.post('/logout', authMiddleware, logout)

module.exports = router