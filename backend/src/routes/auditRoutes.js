const router = require('express').Router()
const { getAll } = require('../controllers/auditController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

router.get('/', authMiddleware, roleMiddleware('ADMIN'), getAll)

module.exports = router