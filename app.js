const WebSocket = require('ws')
const axios = require('axios')
const crypto = require('crypto') // Required for signature generation

// Replace with your actual API key and secret
const apiKey =
  'bfKne23Wn3GygOv9bL4ri8BCqgIRYbtoitPcVT73NYfEjZ8QxKESMa6kaBpTXacD'
const apiSecret =
  '8J9H6Mp2LcXyjn6FclRBBk8DcPUUmEfVxxxBN39UAofSWyTeEtfb4ZcykhxzqyIC'

// Function to generate Binance's signature
function generateSignature(timestamp, apiKey, apiSecret) {
  const message = timestamp + apiKey + apiSecret
  const hash = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex')
  return hash
}

// Create a WebSocket connection
const ws = new WebSocket('wss://stream.binance.com:9443/ws/!userData')

ws.on('open', () => {
  console.log('WebSocket connection established')

  // Function to initiate user data stream
  const initiateUserDataStream = async () => {
    try {
      // Get a listenKey from Binance
      const timestamp = Date.now()
      const signature = generateSignature(timestamp, apiKey, apiSecret)

      const listenKeyRequest = {
        method: 'POST',
        url: 'https://api.binance.com/api/v3/userDataStream',
        headers: {
          'X-MBX-APIKEY': apiKey,
          'X-MBX-TIMESTAMP': timestamp,
          'X-MBX-SIGNATURE': signature
        }
      }

      const listenKeyResponse = await axios(listenKeyRequest)
      const listenKey = listenKeyResponse.data.listenKey

      // Send a user data stream request using the listenKey
      const userDataStreamRequest = {
        method: 'PUT',
        url: 'https://api.binance.com/api/v3/userDataStream',
        headers: {
          'X-MBX-APIKEY': apiKey,
          'X-MBX-TIMESTAMP': Date.now() // Update timestamp for PUT request
        },
        data: {
          listenKey: listenKey
        }
      }

      await axios(userDataStreamRequest)
      console.log('User data stream started')

      // Handle incoming WebSocket messages
      ws.on('message', (message) => {
        const data = JSON.parse(message)

        // Process the received data, including PNL information
        if (data.e === 'executionReport') {
          const pnl = data.p - data.q // Calculate PNL (price - quantity)
          console.log('PNL:', pnl)
          // ... other processing as needed
        }
      })

      // Keepalive logic (optional)
      // ...
    } catch (error) {
      console.error('Error initiating user data stream:', error)
    }
  }

  // Initiate the user data stream
  initiateUserDataStream()
})

ws.on('error', (error) => {
  console.error('WebSocket error:', error)
})

ws.on('close', () => {
  console.log('WebSocket connection closed')
})

// Optional: Keepalive logic to extend listenKey validity
// You can implement a periodic keepalive request using a timer
// to prevent the listenKey from expiring after 60 minutes.
