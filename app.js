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
      const signature = generateSignature(timestamp, apiKey, apiSecret) // Adjust signature generation for Futures

      const listenKeyRequest = {
        method: 'POST',
        url: 'https://fapi.binance.com/fapi/v1/listenKey', // Futures endpoint
        headers: {
          'X-MBX-APIKEY': apiKey,
          'X-MBX-TIMESTAMP': timestamp,
          'X-MBX-SIGNATURE': signature
        }
      }

      console.log('debug1')
      const listenKeyResponse = await axios(listenKeyRequest)
      const listenKey = listenKeyResponse.data.listenKey

      console.log('debug2')

      // Send a user data stream request using the listenKey
      const userDataStreamRequest = {
        method: 'PUT',
        // Update endpoint based on your futures type (USDⓈ-M or Coin-Margined)
        url: `https://fapi.binance.com/fapi/v1/userDataStream&timestamp=${timestamp}`, // Example for USDⓈ-M Futures
        headers: {
          'X-MBX-APIKEY': apiKey
        },
        data: {
          listenKey: listenKey
          // Optional: Include additional parameters for listenKey creation (refer to Binance Futures API documentation)
        }
      }
      console.log('debug3')

      await axios(userDataStreamRequest)
      console.log('User data stream started')

      // ... rest of the code
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
