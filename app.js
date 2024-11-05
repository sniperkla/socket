const WebSocket = require('ws')
const axios = require('axios')
const CryptoJS = require('crypto-js')

// Your API key and secret
const apiKey =
  'bfKne23Wn3GygOv9bL4ri8BCqgIRYbtoitPcVT73NYfEjZ8QxKESMa6kaBpTXacD'
const apiSecret =
  '8J9H6Mp2LcXyjn6FclRBBk8DcPUUmEfVxxxBN39UAofSWyTeEtfb4ZcykhxzqyIC'

// Function to generate a signature
function generateSignature(queryString, apiSecret) {
  const hmac = CryptoJS.HmacSHA256(queryString, apiSecret)
  return hmac.toString(CryptoJS.enc.Hex)
}

// Function to initiate the user data stream
const initiateUserDataStream = async () => {
  try {
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = generateSignature(queryString, apiSecret)

    const response = await axios.post(
      `https://fapi.binance.com/fapi/v1/listenKey?${queryString}&signature=${signature}`,
      {},
      { headers: { 'X-MBX-APIKEY': apiKey } }
    )

    const listenKey = response.data.listenKey
    const ws = new WebSocket(`wss://fstream.binance.com/ws/${listenKey}`)

    ws.on('open', () => {
      console.log('WebSocket connection established')
    })

    ws.on('message', (data) => {
      console.log('Received data:', data)
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

// Start user data stream
initiateUserDataStream()
