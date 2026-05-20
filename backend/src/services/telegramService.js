const sendTelegramAlert = async (text) => {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!token || !chatId) {
        console.log('Telegram не настроен')
        return
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('Ошибка Telegram:', errorText)
        }
    } catch (err) {
        console.error('Не удалось отправить Telegram-уведомление:', err.message)
    }
}

module.exports = {
    sendTelegramAlert
}