require('dotenv').config({ path: '../.env' })
const redis = require('../util/cache')

const deleteRecentMatches = async () => {
  const rooms = await redis.keys('room:*')

  for (const key of rooms) {
    await redis.del(key)
  }
  await redis.disconnect()
}

deleteRecentMatches()
