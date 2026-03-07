const express = require('express')
const { randomUUID } = require('crypto')
const { inspect } = require('util')

const { pool } = require('../db')
const { requireAuth } = require('../middleware/auth.middleware')

const router = express.Router()

const PREMIUM_EXPERT_DISCOUNT_PERCENT = Number(process.env.PREMIUM_EXPERT_DISCOUNT_PERCENT || 15)
const PLATFORM_FEE_PERCENT = 5
const PREMIUM_SUBSCRIPTION_DAYS = Number(process.env.PREMIUM_SUBSCRIPTION_DAYS || 30)
const PREMIUM_SUBSCRIPTION_PRICE = Number(process.env.PREMIUM_SUBSCRIPTION_PRICE || 10)

const MPESA_STK_PUSH_URL = String(
  process.env.MPESA_STK_PUSH_URL ||
    'https://apisandbox.safaricom.et/mpesa/stkpush/v3/processrequest'
).trim()
const MPESA_SHORT_CODE = String(
  process.env.MPESA_SHORT_CODE ||
    process.env.MPESA_SHORTCODE ||
    process.env.MPESA_BUSINESS_SHORT_CODE ||
    ''
).trim()
const MPESA_PASSKEY = String(process.env.MPESA_PASSKEY || '').trim()
const MPESA_PARTY_B = String(process.env.MPESA_PARTY_B || MPESA_SHORT_CODE).trim()
const MPESA_TRANSACTION_TYPE = String(process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline').trim()
const MPESA_ACCESS_TOKEN = String(process.env.MPESA_ACCESS_TOKEN || '').trim()
const MPESA_CURRENCY = String(process.env.MPESA_CURRENCY || 'ETB').trim().toUpperCase()
const MPESA_AUTH_URL = String(process.env.MPESA_AUTH_URL || '').trim()
const MPESA_CONSUMER_KEY = String(process.env.MPESA_CONSUMER_KEY || '').trim()
const MPESA_CONSUMER_SECRET = String(process.env.MPESA_CONSUMER_SECRET || '').trim()
const MPESA_CALLBACK_URL = String(process.env.MPESA_CALLBACK_URL || '').trim()
const MPESA_SANDBOX_TEST_PHONE = String(process.env.MPESA_SANDBOX_TEST_PHONE || '').trim()
const MPESA_USE_SANDBOX_TEST_PHONE = String(process.env.MPESA_USE_SANDBOX_TEST_PHONE || '').trim().toLowerCase()
const MPESA_DEV_CALLBACK_FALLBACK_URL = String(
  process.env.MPESA_DEV_CALLBACK_FALLBACK_URL || 'https://example.com/api/v1/payments/mpesa/callback'
).trim()

let mpesaTokenCache = {
  token: '',
  expiresAt: 0,
}
let hasWarnedLocalMpesaCallback = false
let hasWarnedMpesaCallbackRetryFallback = false
let hasWarnedMpesaPasswordRetry = false
let hasWarnedSandboxPhoneOverride = false

function roundMoney(value) {
  return Number(Number(value).toFixed(2))
}

function isPositiveAmount(value) {
  return Number.isFinite(value) && value > 0
}

function isPremiumActive(user) {
  if (!user?.is_premium || !user?.premium_until) {
    return false
  }

  return new Date(user.premium_until).getTime() > Date.now()
}

function buildTxRef(prefix) {
  const safePrefix = String(prefix || 'tx').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'tx'
  const ts = Date.now().toString(36)
  const rand = randomUUID().replace(/-/g, '').slice(0, 12)
  return `${safePrefix}_${ts}_${rand}`
}

function formatCaughtError(error) {
  if (!error) return 'unknown error'
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return inspect(error, { depth: 4, breakLength: 120 })
}

function toTimestamp(date = new Date(), timeZone = 'UTC') {
  if (!timeZone || timeZone.toUpperCase() === 'UTC') {
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    const h = String(date.getUTCHours()).padStart(2, '0')
    const min = String(date.getUTCMinutes()).padStart(2, '0')
    const s = String(date.getUTCSeconds()).padStart(2, '0')
    return `${y}${m}${d}${h}${min}${s}`
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return `${map.year}${map.month}${map.day}${map.hour}${map.minute}${map.second}`
}

function normalizePhoneNumber(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('251') && digits.length === 12) {
    return digits
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `251${digits.slice(1)}`
  }

  if (digits.startsWith('7') && digits.length === 9) {
    return `251${digits}`
  }

  return null
}

function shouldUseSandboxTestPhone() {
  const explicitToggle =
    MPESA_USE_SANDBOX_TEST_PHONE === '1' ||
    MPESA_USE_SANDBOX_TEST_PHONE === 'true' ||
    MPESA_USE_SANDBOX_TEST_PHONE === 'yes' ||
    MPESA_USE_SANDBOX_TEST_PHONE === 'on'
  if (MPESA_USE_SANDBOX_TEST_PHONE) {
    return explicitToggle
  }

  const isProduction = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production'
  const isSandboxEndpoint = MPESA_STK_PUSH_URL.toLowerCase().includes('apisandbox.safaricom.et')
  return !isProduction && isSandboxEndpoint
}

function resolveMpesaPhoneNumber(rawPhoneNumber) {
  const normalizedInput = normalizePhoneNumber(rawPhoneNumber)
  const normalizedSandbox = normalizePhoneNumber(MPESA_SANDBOX_TEST_PHONE)
  const useSandboxPhone = shouldUseSandboxTestPhone() && Boolean(normalizedSandbox)

  if (useSandboxPhone) {
    if (!hasWarnedSandboxPhoneOverride) {
      hasWarnedSandboxPhoneOverride = true
      console.warn(`Using MPESA_SANDBOX_TEST_PHONE for STK push requests: ${normalizedSandbox}`)
    }
    return normalizedSandbox
  }

  return normalizedInput
}

function parseCallbackMetadata(items) {
  const metadata = {}
  if (!Array.isArray(items)) return metadata

  for (const item of items) {
    const key = String(item?.Name || '').trim()
    if (!key) continue
    metadata[key] = item?.Value ?? null
  }

  return metadata
}

function applyMpesaPassword(shortCode, passkey, timestamp) {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64')
}

function buildMpesaCallbackUrl() {
  const direct = MPESA_CALLBACK_URL
  const fallbackBase = String(process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`).trim()
  const url = direct || `${fallbackBase}/api/v1/payments/mpesa/callback`

  let parsed
  try {
    parsed = new URL(url)
  } catch (_error) {
    throw new Error('Invalid MPESA_CALLBACK_URL (must be absolute URL)')
  }

  const host = parsed.hostname.toLowerCase()
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1'
  const isPublicHttps = parsed.protocol === 'https:' && !isLocalHost
  const isProduction = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production'

  if (!isPublicHttps && isProduction) {
    throw new Error('Invalid CallBackURL config: use a public HTTPS URL for MPESA_CALLBACK_URL')
  }
  if (!isPublicHttps && !hasWarnedLocalMpesaCallback) {
    hasWarnedLocalMpesaCallback = true
    console.warn(
      `Using non-public MPESA callback URL in non-production mode: ${parsed.toString()}. ` +
        'M-Pesa provider callbacks may fail unless this is reachable over public HTTPS.'
    )
  }

  return parsed.toString()
}

function isPublicHttpsUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || '').trim())
    const host = parsed.hostname.toLowerCase()
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1'
    return parsed.protocol === 'https:' && !isLocalHost
  } catch (_error) {
    return false
  }
}

function isMpesaInvalidCallbackError(providerBody, errorMessage) {
  const code = String(providerBody?.errorCode || '').trim()
  const msg = String(
    providerBody?.errorMessage ||
      providerBody?.ResponseDescription ||
      providerBody?.responseDescription ||
      errorMessage ||
      ''
  ).toLowerCase()
  return code === '400.002.02' || msg.includes('invalid callbackurl')
}

function isMpesaPasswordError(providerBody, errorMessage) {
  const code = String(providerBody?.ResponseCode || providerBody?.responseCode || '').trim().toUpperCase()
  const msg = String(
    providerBody?.errorMessage ||
      providerBody?.ResponseDescription ||
      providerBody?.responseDescription ||
      errorMessage ||
      ''
  ).toLowerCase()
  return code === 'SVC0403' || (msg.includes('password') && msg.includes('incorrect'))
}

function getDevFallbackCallbackUrl() {
  if (!isPublicHttpsUrl(MPESA_DEV_CALLBACK_FALLBACK_URL)) {
    return null
  }
  return MPESA_DEV_CALLBACK_FALLBACK_URL
}

async function initializeMpesaStkPush(payload) {
  if (!MPESA_SHORT_CODE || !MPESA_PASSKEY) {
    throw new Error('Missing MPESA_SHORT_CODE or MPESA_PASSKEY')
  }
  const accessToken = await getMpesaAccessToken()

  const sendStkPush = async (requestPayload) => {
    const response = await fetch(MPESA_STK_PUSH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    const data = await response.json().catch(() => ({}))
    const code = String(data?.ResponseCode || data?.responseCode || '')
    if (!response.ok || code !== '0') {
      const error = new Error(
        String(data?.ResponseDescription || data?.responseDescription || data?.errorMessage || 'Failed to initialize M-Pesa STK push')
      )
      error.providerStatus = response.status
      error.providerBody = data
      throw error
    }

    console.info(
      `M-Pesa STK accepted (ResponseCode=0): merchantRequestId=${String(data?.MerchantRequestID || requestPayload.MerchantRequestID)}, checkoutRequestId=${String(data?.CheckoutRequestID || '')}`
    )

    return {
      merchantRequestId: String(data?.MerchantRequestID || requestPayload.MerchantRequestID),
      checkoutRequestId: String(data?.CheckoutRequestID || ''),
      customerMessage: String(data?.CustomerMessage || data?.ResponseDescription || 'STK push sent'),
      raw: data,
      callbackUrlUsed: String(requestPayload.CallBackURL || ''),
    }
  }

  try {
    return await sendStkPush(payload)
  } catch (error) {
    const isProduction = String(process.env.NODE_ENV || '').trim().toLowerCase() === 'production'
    const originalCallbackUrl = String(payload?.CallBackURL || '').trim()
    const fallbackCallbackUrl = getDevFallbackCallbackUrl()
    const shouldRetryWithCallbackFallback =
      !isProduction &&
      !isPublicHttpsUrl(originalCallbackUrl) &&
      Boolean(fallbackCallbackUrl) &&
      isMpesaInvalidCallbackError(error?.providerBody, error?.message)

    const shouldRetryWithEATPassword =
      isMpesaPasswordError(error?.providerBody, error?.message) &&
      String(payload?.BusinessShortCode || '').trim() &&
      String(payload?.Timestamp || '').trim().length === 14 &&
      Boolean(MPESA_PASSKEY)

    if (!shouldRetryWithCallbackFallback && !shouldRetryWithEATPassword) {
      throw error
    }

    const retryPayload = {
      ...payload,
    }

    if (shouldRetryWithCallbackFallback && !hasWarnedMpesaCallbackRetryFallback) {
      hasWarnedMpesaCallbackRetryFallback = true
      console.warn(
        `M-Pesa rejected local callback URL (${originalCallbackUrl}). Retrying with fallback URL: ${fallbackCallbackUrl}`
      )
    }
    if (shouldRetryWithCallbackFallback) {
      retryPayload.CallBackURL = fallbackCallbackUrl
    }

    if (shouldRetryWithEATPassword) {
      const eatTimestamp = toTimestamp(new Date(), 'Africa/Nairobi')
      if (!hasWarnedMpesaPasswordRetry) {
        hasWarnedMpesaPasswordRetry = true
        console.warn(
          `M-Pesa rejected generated password. Retrying with ${eatTimestamp} timestamp in Africa/Nairobi timezone.`
        )
      }
      retryPayload.Timestamp = eatTimestamp
      retryPayload.Password = applyMpesaPassword(String(retryPayload.BusinessShortCode), MPESA_PASSKEY, eatTimestamp)
    }

    return await sendStkPush(retryPayload)
  }
}

async function getMpesaAccessToken() {
  const hasDynamicAuthConfig = Boolean(MPESA_AUTH_URL && MPESA_CONSUMER_KEY && MPESA_CONSUMER_SECRET)
  if (!hasDynamicAuthConfig) {
    if (MPESA_ACCESS_TOKEN) {
      return MPESA_ACCESS_TOKEN.replace(/^Bearer\s+/i, '').trim()
    }
    throw new Error(
      'Missing M-Pesa auth config. Set MPESA_AUTH_URL + MPESA_CONSUMER_KEY + MPESA_CONSUMER_SECRET (recommended) or MPESA_ACCESS_TOKEN'
    )
  }

  const now = Date.now()
  if (mpesaTokenCache.token && mpesaTokenCache.expiresAt > now + 10_000) {
    return mpesaTokenCache.token
  }

  const basicAuth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64')
  const response = await fetch(MPESA_AUTH_URL, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  })

  const data = await response.json().catch(() => ({}))
  const token = String(data?.access_token || data?.token || data?.accessToken || '').trim()
  if (!response.ok || !token) {
    const err = new Error(String(data?.error_description || data?.error || data?.message || 'Failed to fetch M-Pesa access token'))
    err.providerStatus = response.status
    err.providerBody = data
    throw err
  }

  const expiresInSec = Number(data?.expires_in || 3500)
  mpesaTokenCache = {
    token,
    expiresAt: Date.now() + Math.max(60, expiresInSec) * 1000,
  }
  return token
}

async function activatePremiumIfNeeded(transaction, nextStatus) {
  if (
    nextStatus === 'success' &&
    transaction.kind === 'premium_subscription' &&
    transaction.chapa_status !== 'success'
  ) {
    await pool.query(
      `
        UPDATE users
        SET
          is_premium = TRUE,
          premium_until = CASE
            WHEN premium_until IS NULL OR premium_until < NOW()
              THEN NOW() + ($2 || ' days')::interval
            ELSE premium_until + ($2 || ' days')::interval
          END
        WHERE id = $1
      `,
      [transaction.user_id, PREMIUM_SUBSCRIPTION_DAYS]
    )
  }
}

router.post('/premium/initialize', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const phoneNumber = resolveMpesaPhoneNumber(req.body.phoneNumber)

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Valid phoneNumber is required in 2517XXXXXXXX format' })
    }

    const userResult = await pool.query(
      `
        SELECT id, name, email, is_premium, premium_until
        FROM users
        WHERE id = $1
        LIMIT 1
      `,
      [userId]
    )

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = userResult.rows[0]
    const amount = roundMoney(PREMIUM_SUBSCRIPTION_PRICE)
    if (!isPositiveAmount(amount)) {
      return res.status(400).json({ message: 'Invalid premium subscription price configuration' })
    }

    const txId = randomUUID()
    const txRef = buildTxRef('premium')
    const callbackUrl = buildMpesaCallbackUrl()
    const timestamp = toTimestamp()

    const mpesa = await initializeMpesaStkPush({
      MerchantRequestID: txRef,
      BusinessShortCode: MPESA_SHORT_CODE,
      Password: applyMpesaPassword(MPESA_SHORT_CODE, MPESA_PASSKEY, timestamp),
      Timestamp: timestamp,
      TransactionType: MPESA_TRANSACTION_TYPE,
      Amount: Math.max(1, Math.round(amount)),
      PartyA: phoneNumber,
      PartyB: MPESA_PARTY_B,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: String(txRef).slice(0, 12),
      TransactionDesc: 'Premium plan'.slice(0, 13),
      ReferenceData: [{ Key: 'ThirdPartyReference', Value: txRef }],
    })

    await pool.query(
      `
        INSERT INTO payment_transactions (
          id, user_id, kind, service_type, base_amount, discount_amount, final_amount,
          platform_fee_amount, expert_amount, tx_ref, chapa_checkout_url, metadata
        )
        VALUES ($1, $2, 'premium_subscription', 'premium', $3, 0, $3, 0, 0, $4, NULL, $5::jsonb)
      `,
      [
        txId,
        userId,
        amount,
        txRef,
        JSON.stringify({
          provider: 'mpesa',
          phoneNumber,
          merchantRequestId: mpesa.merchantRequestId,
          checkoutRequestId: mpesa.checkoutRequestId,
          isPremiumActive: isPremiumActive(user),
          mpesaInit: mpesa.raw,
        }),
      ]
    )

    return res.status(201).json({
      txRef,
      amount,
      currency: MPESA_CURRENCY,
      premiumDays: PREMIUM_SUBSCRIPTION_DAYS,
      paymentProvider: 'mpesa',
      promptSent: true,
      customerMessage: mpesa.customerMessage,
      checkoutRequestId: mpesa.checkoutRequestId,
    })
  } catch (error) {
    const readableError = formatCaughtError(error)
    console.error('Premium payment initialization failed:', readableError)
    if (error?.providerBody) {
      console.error('Premium payment provider response:', inspect(error.providerBody, { depth: 4, breakLength: 120 }))
    }
    return res.status(502).json({
      message: 'Failed to initialize premium payment',
      error: readableError,
      providerStatus: error?.providerStatus || null,
    })
  }
})

router.post('/expert-communication/initialize', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub
    const expertId = String(req.body.expertId || '').trim()
    const mode = String(req.body.mode || '').trim().toLowerCase()
    const phoneNumber = resolveMpesaPhoneNumber(req.body.phoneNumber)

    if (!expertId || !['chat', 'voice', 'video'].includes(mode)) {
      return res.status(400).json({ message: 'expertId and valid mode are required' })
    }
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Valid phoneNumber is required in 2517XXXXXXXX format' })
    }

    if (expertId === userId) {
      return res.status(400).json({ message: 'You cannot pay yourself for a consultation' })
    }

    const [userResult, expertResult] = await Promise.all([
      pool.query(
        `
          SELECT id, name, email, is_premium, premium_until
          FROM users
          WHERE id = $1
          LIMIT 1
        `,
        [userId]
      ),
      pool.query(
        `
          SELECT
            u.id,
            u.name,
            u.email,
            u.is_expert,
            a.chat_price_usd,
            a.voice_price_usd,
            a.video_price_usd
          FROM users u
          LEFT JOIN LATERAL (
            SELECT chat_price_usd, voice_price_usd, video_price_usd
            FROM expert_applications
            WHERE user_id = u.id AND status = 'approved'
            ORDER BY reviewed_at DESC NULLS LAST, created_at DESC
            LIMIT 1
          ) a ON TRUE
          WHERE u.id = $1
          LIMIT 1
        `,
        [expertId]
      ),
    ])

    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    if (expertResult.rowCount === 0 || !expertResult.rows[0].is_expert) {
      return res.status(404).json({ message: 'Expert not found or not approved' })
    }

    const user = userResult.rows[0]
    const expert = expertResult.rows[0]
    const baseAmount = roundMoney(Number(expert[`${mode}_price_usd`]))
    if (!isPositiveAmount(baseAmount)) {
      return res.status(400).json({ message: `This expert has not set ${mode} pricing yet` })
    }

    const premiumActive = isPremiumActive(user)
    const discountPercent = premiumActive ? PREMIUM_EXPERT_DISCOUNT_PERCENT : 0
    const discountAmount = roundMoney((baseAmount * discountPercent) / 100)
    const finalAmount = roundMoney(baseAmount - discountAmount)
    const platformFee = roundMoney((finalAmount * PLATFORM_FEE_PERCENT) / 100)
    const expertAmount = roundMoney(finalAmount - platformFee)

    const txId = randomUUID()
    const txRef = buildTxRef('expert')
    const callbackUrl = buildMpesaCallbackUrl()
    const timestamp = toTimestamp()

    const mpesa = await initializeMpesaStkPush({
      MerchantRequestID: txRef,
      BusinessShortCode: MPESA_SHORT_CODE,
      Password: applyMpesaPassword(MPESA_SHORT_CODE, MPESA_PASSKEY, timestamp),
      Timestamp: timestamp,
      TransactionType: MPESA_TRANSACTION_TYPE,
      Amount: Math.max(1, Math.round(finalAmount)),
      PartyA: phoneNumber,
      PartyB: MPESA_PARTY_B,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackUrl,
      AccountReference: String(expert.id || txRef).slice(0, 12),
      TransactionDesc: String(`${mode} consult`).slice(0, 13),
      ReferenceData: [{ Key: 'ThirdPartyReference', Value: txRef }],
    })

    await pool.query(
      `
        INSERT INTO payment_transactions (
          id, user_id, kind, expert_user_id, service_type, base_amount, discount_amount, final_amount,
          platform_fee_amount, expert_amount, tx_ref, chapa_checkout_url, metadata
        )
        VALUES ($1, $2, 'expert_consultation', $3, $4, $5, $6, $7, $8, $9, $10, NULL, $11::jsonb)
      `,
      [
        txId,
        userId,
        expertId,
        mode,
        baseAmount,
        discountAmount,
        finalAmount,
        platformFee,
        expertAmount,
        txRef,
        JSON.stringify({
          provider: 'mpesa',
          phoneNumber,
          merchantRequestId: mpesa.merchantRequestId,
          checkoutRequestId: mpesa.checkoutRequestId,
          premiumActive,
          discountPercent,
          expertName: expert.name,
          mpesaInit: mpesa.raw,
        }),
      ]
    )

    return res.status(201).json({
      txRef,
      pricing: {
        baseAmount,
        discountAmount,
        finalAmount,
        platformFee,
        expertAmount,
        discountPercent,
        premiumApplied: premiumActive,
      },
      currency: MPESA_CURRENCY,
      paymentProvider: 'mpesa',
      promptSent: true,
      customerMessage: mpesa.customerMessage,
      checkoutRequestId: mpesa.checkoutRequestId,
    })
  } catch (error) {
    const readableError = formatCaughtError(error)
    console.error('Expert communication payment initialization failed:', readableError)
    if (error?.providerBody) {
      console.error('Expert communication provider response:', inspect(error.providerBody, { depth: 4, breakLength: 120 }))
    }
    return res.status(502).json({
      message: 'Failed to initialize expert communication payment',
      error: readableError,
      providerStatus: error?.providerStatus || null,
    })
  }
})

router.post('/:txRef/verify', requireAuth, async (req, res) => {
  try {
    const txRef = String(req.params.txRef || '').trim()
    if (!txRef) {
      return res.status(400).json({ message: 'txRef is required' })
    }

    const transactionResult = await pool.query(
      `
        SELECT *
        FROM payment_transactions
        WHERE tx_ref = $1 AND user_id = $2
        LIMIT 1
      `,
      [txRef, req.auth.sub]
    )

    if (transactionResult.rowCount === 0) {
      return res.status(404).json({ message: 'Transaction not found' })
    }

    const transaction = transactionResult.rows[0]

    if (transaction.chapa_status === 'success') {
      await activatePremiumIfNeeded(transaction, 'success')
    }

    return res.status(200).json({
      txRef,
      status: transaction.chapa_status,
      kind: transaction.kind,
      pricing: {
        baseAmount: Number(transaction.base_amount),
        discountAmount: Number(transaction.discount_amount),
        finalAmount: Number(transaction.final_amount),
        platformFee: Number(transaction.platform_fee_amount),
        expertAmount: Number(transaction.expert_amount),
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to verify payment', error: error.message })
  }
})

router.post('/mpesa/callback', async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback || req.body?.stkCallback || req.body
    const merchantRequestId = String(callback?.MerchantRequestID || '').trim()
    const checkoutRequestId = String(callback?.CheckoutRequestID || '').trim()
    const resultCode = Number(callback?.ResultCode)
    const resultDesc = String(callback?.ResultDesc || '').trim()
    const metadata = parseCallbackMetadata(callback?.CallbackMetadata?.Item)

    if (!merchantRequestId && !checkoutRequestId) {
      return res.status(200).json({ ok: true, ignored: true })
    }

    const matchResult = await pool.query(
      `
        SELECT *
        FROM payment_transactions
        WHERE tx_ref = $1
           OR (metadata->>'checkoutRequestId') = $2
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [merchantRequestId, checkoutRequestId]
    )

    if (matchResult.rowCount === 0) {
      return res.status(200).json({ ok: true, ignored: true })
    }

    const tx = matchResult.rows[0]
    const status = resultCode === 0 ? 'success' : resultCode === 1032 ? 'canceled' : 'failed'

    if (resultCode === 0) {
      console.info(`M-Pesa callback success for txRef=${tx.tx_ref}, checkoutRequestId=${checkoutRequestId}`)
    } else if (resultCode === 1032) {
      console.info(`M-Pesa callback canceled by user for txRef=${tx.tx_ref}, checkoutRequestId=${checkoutRequestId}`)
    }

    await pool.query(
      `
        UPDATE payment_transactions
        SET chapa_status = $1, metadata = metadata || $2::jsonb, updated_at = NOW()
        WHERE id = $3
      `,
      [
        status,
        JSON.stringify({
          mpesaCallback: {
            merchantRequestId,
            checkoutRequestId,
            resultCode,
            resultDesc,
            metadata,
            raw: req.body,
          },
        }),
        tx.id,
      ]
    )

    await activatePremiumIfNeeded(tx, status)

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('M-Pesa callback handling failed:', error?.message || error)
    return res.status(200).json({ ok: true })
  }
})

router.post('/chapa/callback', async (_req, res) => {
  return res.status(200).json({ ok: true, deprecated: true })
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          kind,
          expert_user_id,
          service_type,
          base_amount,
          discount_amount,
          final_amount,
          platform_fee_amount,
          expert_amount,
          tx_ref,
          chapa_status,
          metadata,
          created_at
        FROM payment_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `,
      [req.auth.sub]
    )

    return res.status(200).json({
      transactions: result.rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        expertUserId: row.expert_user_id,
        serviceType: row.service_type,
        txRef: row.tx_ref,
        status: row.chapa_status,
        paymentProvider: row.metadata?.provider || 'unknown',
        pricing: {
          baseAmount: Number(row.base_amount),
          discountAmount: Number(row.discount_amount),
          finalAmount: Number(row.final_amount),
          platformFee: Number(row.platform_fee_amount),
          expertAmount: Number(row.expert_amount),
        },
        createdAt: row.created_at,
      })),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch payment history', error: error.message })
  }
})

module.exports = router
