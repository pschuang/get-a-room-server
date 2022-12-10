const redis = require('../util/cache')

const getRecentMatches = async () => {
  let matches = []
  const rooms = await redis.keys('room:*') // 找出所有 'room:' 開頭的 keys

  for (const key of rooms) {
    const members = await redis.hget(key, 'members')
    const time = await redis.hget(key, 'created_dt')
    matches.push({ users: JSON.parse(members), time })
  }

  return matches
}

module.exports = getRecentMatches