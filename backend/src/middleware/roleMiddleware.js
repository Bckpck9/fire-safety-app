const { writeAuditLog, getClientIp } = require('../services/auditService')

const roleMiddleware = (...allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            try {
                await writeAuditLog({
                    userId: req.user?.id || null,
                    action: 'ACCESS_DENIED',
                    entity: 'Auth',
                    entityId: req.user?.id || null,
                    details: `Попытка доступа без прав. Роль пользователя: ${req.user?.role || 'неизвестна'}. Требуемые роли: ${allowedRoles.join(', ')}`,
                    ip: getClientIp(req)
                })

                console.log('ACCESS_DENIED записан в audit log')
            } catch (err) {
                console.error('Не удалось записать ACCESS_DENIED:', err)
            }

            return res.status(403).json({ message: 'Недостаточно прав доступа' })
        }

        next()
    }
}

module.exports = roleMiddleware