import { toast as hotToast } from 'react-hot-toast'

const DUPLICATE_WINDOW_MS = 1200
const lastShownAt = new Map()

function normalizeMessage(message) {
    if (typeof message === 'string') {
        return message.trim().toLowerCase().replace(/\s+/g, ' ')
    }

    if (message == null) return 'empty-message'
    return String(message)
}

function buildToastId(type, message, options) {
    if (options?.id) return options.id
    return `${type}:${normalizeMessage(message)}`
}

function isDuplicate(id) {
    const now = Date.now()
    const prev = lastShownAt.get(id)
    lastShownAt.set(id, now)

    if (!prev) return false
    return now - prev < DUPLICATE_WINDOW_MS
}

function show(type, message, options) {
    const id = buildToastId(type, message, options)

    if (isDuplicate(id)) {
        return id
    }

    return hotToast[type](message, {
        ...options,
        id,
    })
}

const toast = {
    success: (message, options) => show('success', message, options),
    error: (message, options) => show('error', message, options),
    loading: (message, options) => show('loading', message, options),
    custom: hotToast.custom,
    dismiss: hotToast.dismiss,
    remove: hotToast.remove,
    promise: hotToast.promise,
}

export default toast
