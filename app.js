const WebSocket = require('ws')
const axios = require('axios')
const binanceWsUrl = 'wss://stream.binance.com:9443/ws/!userData'

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
const ws = new WebSocket(binanceWsUrl)

ws.on('open', () => {
  console.log('WebSocket connected')

  // Send a listen key request to Binance
  const listenKeyRequest = {
    method: 'POST',
    url: 'https://api.binance.com/api/v3/userDataStream',
    headers: {
      'X-MBX-APIKEY': apiKey
    }
  }

  console.log('this is listenkey', listenKeyRequest)

  axios(listenKeyRequest)
    .then((response) => {
      const listenKey = response.data.listenKey
      // Send a user data stream request to Binance
      const userDataStreamRequest = {
        method: 'PUT',
        url: `https://api.binance.com/api/v3/userDataStream`,
        headers: {
          'X-MBX-APIKEY': apiKey
        },
        data: {
          listenKey: listenKey
        }
      }

      axios(userDataStreamRequest)
        .then(() => {
          console.log('User data stream started')

          // Send a keepalive request every 30 minutes
          setInterval(() => {
            const keepaliveRequest = {
              method: 'PUT',
              url: `https://api.binance.com/api/v3/userDataStream`,
              headers: {
                'X-MBX-APIKEY': apiKey
              },
              data: {
                listenKey: listenKey
              }
            }

            axios(keepaliveRequest)
              .then(() => {
                console.log('Keepalive sent')
              })
              .catch((error) => {
                console.error('Keepalive error:', error)
              })
          }, 1800000) // 30 minutes

          // Handle incoming WebSocket messages
          ws.on('message', (message) => {
            const data = JSON.parse(message)

            // Process the received data, including PNL information
            if (data.e === 'executionReport') {
              const pnl = data.n - data.p // Calculate PNL
              console.log('PNL:', pnl)
              // ... other processing as needed
            }
          })
        })
        .catch((error) => {
          console.error('User data stream error:', error)
        })
    })
    .catch((error) => {
      console.error('Listen key request error:', error)
    })
})

ws.on('error', (error) => {
  console.error('WebSocket error:', error)
})

ws.on('close', () => {
  console.log('WebSocket closed')
})
