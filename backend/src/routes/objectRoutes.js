const router = require('express').Router()
const { getAll, getOne, create, update, remove } = require('../controllers/objectController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, getAll)
router.get('/:id', authMiddleware, getOne)
router.post('/', authMiddleware, create)
router.put('/:id', authMiddleware, update)
router.delete('/:id', authMiddleware, remove)

module.exports = router