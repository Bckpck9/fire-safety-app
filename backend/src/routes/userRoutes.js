const router = require('express').Router()
const { getAll, updateRole, remove } = require('../controllers/userController')
const { authMiddleware } = require('../middleware/authMiddleware')

router.get('/', authMiddleware, requireRole('ADMIN'), getAll)
router.put('/:id/role', authMiddleware, requireRole('ADMIN'), updateRole)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), remove)

module.exports = router