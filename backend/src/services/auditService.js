const prisma = require('../prisma')

const writeAuditLog = async ({
    userId = null,
    action,
    entity = null,
    entityId = null,
    details = null,
    ip = null
}) => {
    try {
        if (!action) {
            return
        }

        await prisma.auditLog.create({
            data: {
                userId: userId || null,
                action: String(action),
                entity: entity ? String(entity) : null,
                entityId: entityId !== null && entityId !== undefined ? String(entityId) : null,
                details: details ? String(details) : null,
                ip: ip ? String(ip) : null
            }
        })
    } catch (err) {
        console.error('Ошибка записи audit log:', err)
    }
}

const getClientIp = (req) => {
    return (
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        null
    )
}

module.exports = {
    writeAuditLog,
    getClientIp
}