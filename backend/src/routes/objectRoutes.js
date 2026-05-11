const router = require('express').Router()
const { getAll, getOne, create, update, remove } = require('../controllers/objectController')
const { authMiddleware } = require('../middleware/authMiddleware')

//смотреть могут все авторизованные
router.get('/', authMiddleware, getAll)
router.get('/:id', authMiddleware, getOne)

//создавать и редактировать - только INSPECTOR и ADMIN
router.post('/', authMiddleware, requireRole('INSPECTOR', 'ADMIN'), create)
router.put('/:id', authMiddleware, requireRole('INSPECTOR', 'ADMIN'), update)

//удалять — только ADMIN
router.delete('/:id', authMiddleware, requireRole('ADMIN'), remove)

module.exports = router