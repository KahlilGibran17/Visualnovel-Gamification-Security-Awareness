const jwt = require('jsonwebtoken')
const SECRET = process.env.JWT_SECRET || 'akebono_dev_secret'

function requireAuth(req, res, next) {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' })
    }
    try {
        const payload = jwt.verify(auth.slice(7), SECRET)
        req.user = payload
        next()
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' })
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return res.status(403).json({ message: 'Forbidden' })
        }
        next()
    }
}

module.exports = { requireAuth, requireRole }
