import pkg from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import axios from 'axios'

const { Client, LocalAuth } = pkg

const WEBHOOK_URL = process.env.WHATSAPP_TARGET_WEBHOOK_URL || 'https://prometheus-ai.fly.dev/api/whatsapp/webhook'
const WEBHOOK_TOKEN = process.env.WHATSAPP_WEBHOOK_TOKEN
const CLIENT_ID = process.env.WHATSAPP_BOT_CLIENT_ID || 'prometheus-bot'
const ALLOWED_PHONE = (process.env.WHATSAPP_ALLOWED_PHONE || '').replace(/\D/g, '')

if (!WEBHOOK_TOKEN) {
  console.error('Missing WHATSAPP_WEBHOOK_TOKEN in environment')
  process.exit(1)
}

const client = new Client({
  authStrategy: new LocalAuth({ clientId: CLIENT_ID }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
})

client.on('qr', (qr) => {
  console.log('Scan this QR code with WhatsApp:')
  qrcode.generate(qr, { small: true })
})

client.on('authenticated', () => {
  console.log('WhatsApp authenticated')
})

client.on('ready', () => {
  console.log('WhatsApp bot connected and listening for messages')
  console.log(`Forward target: ${WEBHOOK_URL}`)
  if (ALLOWED_PHONE) {
    console.log(`Allowed sender only: ${ALLOWED_PHONE}`)
  }
})

client.on('auth_failure', (message) => {
  console.error('WhatsApp auth failure:', message)
})

client.on('disconnected', (reason) => {
  console.error('WhatsApp disconnected:', reason)
})

client.on('message', async (msg) => {
  try {
    const from = msg.from.replace('@c.us', '').replace(/\D/g, '')
    const body = (msg.body || '').trim()

    if (!from || !body) return

    if (ALLOWED_PHONE && from !== ALLOWED_PHONE) {
      console.log(`Ignored message from ${from} (not allowed)`) 
      return
    }

    const response = await axios.post(
      WEBHOOK_URL,
      {
        from,
        message: body
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-token': WEBHOOK_TOKEN
        },
        timeout: 15000
      }
    )

    const ok = response.data?.success ? 'success' : 'processed'
    console.log(`Forwarded message from ${from}: ${ok}`)
  } catch (error) {
    const details = error?.response?.data || error?.message || error
    console.error('Failed to forward message:', details)
  }
})

client.initialize()
