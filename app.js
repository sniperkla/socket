const WebSocket = require('ws')
const axios = require('axios')
const crypto = require('crypto')

// Replace with your actual API key and secret
const apiKey =
  'bfKne23Wn3GygOv9bL4ri8BCqgIRYbtoitPcVT73NYfEjZ8QxKESMa6kaBpTXacD'
const apiSecret =
  '8J9H6Mp2LcXyjn6FclRBBk8DcPUUmEfVxxxBN39UAofSWyTeEtfb4ZcykhxzqyIC'

// Function to generate Binance's signature
function generateSignature(queryString, apiSecret) {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex')
}

// Function to initiate user data stream
const initiateUserDataStream = async () => {
  try {
    // Get a listenKey from Binance
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    const signature = generateSignature(queryString, apiSecret)

    const listenKeyResponse = await axios.post(
      `https://fapi.binance.com/fapi/v1/listenKey?${queryString}&signature=${signature}`,
      {},
      { headers: { 'X-MBX-APIKEY': apiKey } }
    )

    const listenKey = listenKeyResponse.data.listenKey
    console.log('Listen Key received:', listenKey)

    // Connect to WebSocket using the listenKey
    const ws = new WebSocket(`wss://fstream.binance.com/ws/${listenKey}`)

    // Listen for messages
    ws.on('message', (data) => {
      console.log('fuku')

      const parsedData = JSON.parse(data) // Parse the JSON message
      if (parsedData.e === 'ACCOUNT_UPDATE') {
        const positions = parsedData.a?.P || [] // Access positions array
        positions.forEach((position) => {
          const { unPNL } = position // Extract unPNL from each position
          console.log('Unrealized PNL:', unPNL) // Print only unPNL
        })
      }
    })
    ws.on('open', () => {
      console.log('WebSocket connection established for user data stream')
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    ws.on('close', () => {
      console.log('WebSocket connection closed')
    })

    // Keepalive function to prevent listenKey expiration
    const keepAliveInterval = setInterval(async () => {
      try {
        await axios.put(
          `https://fapi.binance.com/fapi/v1/listenKey?timestamp=${Date.now()}`,
          {},
          { headers: { 'X-MBX-APIKEY': apiKey } }
        )
        console.log('Keepalive sent for listenKey')
      } catch (err) {
        console.error('Error sending keepalive for listenKey:', err)
        clearInterval(keepAliveInterval) // Stop keepalive if it fails
      }
    }, 3000) // Send keepalive every 30 minutes
  } catch (error) {
    console.error(
      'Error initiating user data stream:',
      error.response ? error.response.data : error.message
    )
  }
}

// Start user data stream
initiateUserDataStream()
