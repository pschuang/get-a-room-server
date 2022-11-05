require('dotenv').config
// const cache = require('../util/cache')

const getFriends = async (req, res) => {
  const users = await cache.hgetall('1234')
  console.log(users)
  const arr = users.users.split(',')
  console.log(arr)

  res.send('Hello')
}

module.exports = { getFriends }
