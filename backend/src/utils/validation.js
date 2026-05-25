const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())
}

const isValidLogin = (login) => {
    return /^[a-zA-Z0-9_]{3,30}$/.test(String(login).trim())
}

const isValidCoordinate = (value, min, max) => {
    if (value === undefined || value === null || value === '') {
        return true
    }

    const number = Number(value)
    return !Number.isNaN(number) && number >= min && number <= max
}

module.exports = {
    isValidEmail,
    isValidLogin,
    isValidCoordinate
}