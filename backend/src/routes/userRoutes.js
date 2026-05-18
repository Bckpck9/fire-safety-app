const router = require('express').Router()
const { getAll, update, remove } = require('../controllers/userController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, getAll)
router.put('/:id', authMiddleware, update) 
router.delete('/:id', authMiddleware, remove)

module.exports = router