require('dotenv').config()
const { API_VERSION } = process.env
// Express Initialization
const express = require('express')
const cors = require('cors')
const app = express()

// CORS allow all
app.use(cors())
app.use(express.json())

// API routes
app.use('/api/' + API_VERSION, [
  require('./routes/chatroom_route'),
  require('./routes/friends_route'),
  require('./routes/questions_route'),
  require('./routes/user_route'),
  require('./routes/admin_route'),
])

// page not found
app.use(function (req, res) {
  res.status(404).json({ message: 'Page not found.' })
})

// Error handling
app.use(function (err, req, res, next) {
  console.log('ERROR:', err)
  res.status(500).send({ message: 'Internal Server Error' })
})

module.exports = app
