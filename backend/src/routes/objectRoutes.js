const router = require('express').Router()
const { getAll, getOne, create, update, remove } = require('../controllers/objectController')
const authMiddleware = require('../middleware/authMiddleware')
const roleMiddleware = require('../middleware/roleMiddleware')

router.get('/', authMiddleware, getAll)
router.get('/:id', authMiddleware, getOne)

router.post(
    '/',
    authMiddleware,
    roleMiddleware('USER', 'SPECIALIST', 'ADMIN'),
    create
)

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('SPECIALIST', 'ADMIN'),
    update
)

router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('ADMIN'),
    remove
)

module.exports = router