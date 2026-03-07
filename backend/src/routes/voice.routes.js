const express = require('express')
const { randomUUID } = require('crypto')

const { pool } = require('../db')
const { generateGroundedAnswer, transcribeAudioFromUrl } = require('../services/grounded-ai.service')

const router = express.Router()

const OPTION_TO_TOPIC = {
  '1': 'medical',
  '2': 'medical',
  '3': 'nutrition',
  '4': 'general',
}

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function twiml(res, body) {
  res.type('text/xml')
  return res.send(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`)
}

function renderMenuTwiml() {
  return [
    '<Gather numDigits="1" action="/api/v1/voice/incoming" method="POST" timeout="8">',
    '<Say language="en-US">Welcome to Mother Support Ethiopia.</Say>',
    '<Say language="en-US">Press 1 for pregnancy advice.</Say>',
    '<Say language="en-US">Press 2 for baby health.</Say>',
    '<Say language="en-US">Press 3 for breastfeeding help.</Say>',
    '<Say language="en-US">Press 4 to record your question for AI support.</Say>',
    '</Gather>',
    '<Say language="en-US">We did not receive input. Goodbye.</Say>',
    '<Hangup/>',
  ].join('')
}

function getQuickSupportMessage(option) {
  if (option === '1') {
    return 'For pregnancy safety, severe pain, heavy bleeding, fever, or reduced baby movement needs urgent care. Please contact a clinician immediately if these happen.'
  }
  if (option === '2') {
    return 'For baby health, go to urgent care if your baby has breathing difficulty, high fever, poor feeding, repeated vomiting, or unusual sleepiness.'
  }
  if (option === '3') {
    return 'For breastfeeding, feed often, check for deep latch, and monitor wet diapers. If baby is not feeding well or seems dehydrated, seek medical support today.'
  }
  return 'Please try again and choose a valid option.'
}

async function createVoiceCallLog({ caller, menuOption, recordingUrl, transcript, aiResponse, status, errorMessage }) {
  const id = randomUUID()
  await pool.query(
    `
      INSERT INTO voice_calls (
        id, caller, menu_option, recording_url, transcript, ai_response, status, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      id,
      caller || '',
      menuOption || null,
      recordingUrl || null,
      transcript || '',
      aiResponse || '',
      status || 'received',
      errorMessage || '',
    ]
  )

  return id
}

router.post('/incoming', async (req, res) => {
  try {
    const digits = String(req.body.Digits || '').trim()

    if (!digits) {
      return twiml(res, renderMenuTwiml())
    }

    if (digits === '4') {
      return twiml(
        res,
        [
          '<Say language="en-US">Please record your question after the beep. Press any key when finished.</Say>',
          '<Record maxLength="90" playBeep="true" action="/api/v1/voice/recording-complete?option=4" method="POST"/>',
          '<Say language="en-US">No recording received. Goodbye.</Say>',
          '<Hangup/>',
        ].join('')
      )
    }

    if (digits === '1' || digits === '2' || digits === '3') {
      const message = getQuickSupportMessage(digits)
      await createVoiceCallLog({
        caller: String(req.body.From || ''),
        menuOption: digits,
        recordingUrl: '',
        transcript: '',
        aiResponse: message,
        status: 'processed',
        errorMessage: '',
      })

      return twiml(
        res,
        [
          `<Say language="en-US">${xmlEscape(message)}</Say>`,
          '<Say language="en-US">To ask a detailed question, please call again and press 4.</Say>',
          '<Hangup/>',
        ].join('')
      )
    }

    return twiml(
      res,
      [
        '<Say language="en-US">Invalid option.</Say>',
        renderMenuTwiml(),
      ].join('')
    )
  } catch (error) {
    console.error('Voice incoming webhook failed:', error?.message || error)
    return twiml(
      res,
      [
        '<Say language="en-US">Sorry, something went wrong. Please try again later.</Say>',
        '<Hangup/>',
      ].join('')
    )
  }
})

router.post('/recording-complete', async (req, res) => {
  const caller = String(req.body.From || '').trim()
  const recordingUrl = String(req.body.RecordingUrl || '').trim()
  const option = String(req.query.option || req.body.option || '4').trim()
  const topic = OPTION_TO_TOPIC[option] || 'general'

  if (!recordingUrl) {
    return twiml(
      res,
      [
        '<Say language="en-US">No recording was received. Please call again and try once more.</Say>',
        '<Hangup/>',
      ].join('')
    )
  }

  try {
    let transcript = ''
    try {
      transcript = await transcribeAudioFromUrl(recordingUrl)
    } catch (sttError) {
      console.error('Voice transcription failed:', sttError?.message || sttError)
      transcript = ''
    }

    const questionText = transcript || 'Caller submitted a voice question but transcription was empty.'
    const ai = await generateGroundedAnswer({
      pool,
      question: questionText,
      topic,
    })

    await createVoiceCallLog({
      caller,
      menuOption: option,
      recordingUrl,
      transcript,
      aiResponse: ai.answer,
      status: 'processed',
      errorMessage: '',
    })

    return twiml(
      res,
      [
        `<Say language="en-US">${xmlEscape(ai.answer)}</Say>`,
        '<Say language="en-US">This is general support information, not medical diagnosis.</Say>',
        '<Hangup/>',
      ].join('')
    )
  } catch (error) {
    const errMsg = String(error?.message || error || 'Unknown error')
    console.error('Voice recording processing failed:', errMsg)

    try {
      await createVoiceCallLog({
        caller,
        menuOption: option,
        recordingUrl,
        transcript: '',
        aiResponse: '',
        status: 'failed',
        errorMessage: errMsg,
      })
    } catch (logError) {
      console.error('Failed to persist failed voice call:', logError?.message || logError)
    }

    return twiml(
      res,
      [
        '<Say language="en-US">Sorry, we could not process your question right now. Please try again later.</Say>',
        '<Hangup/>',
      ].join('')
    )
  }
})

module.exports = router
