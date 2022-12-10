const Cache = require('../models/cache_model')

const getRecentMatches = async () => {
  let matches = []
  const roomIdList = await Cache.getKeyListByPattern('room:*') // 找出所有 'room:' 開頭的 keys
  const newRoomList = roomIdList.map((roomId) => roomId.slice(5))

  for (const roomId of newRoomList) {
    const members = await Cache.getMembers(roomId)
    const time = await Cache.getCreatedDt(roomId)
    matches.push({ users: JSON.parse(members), time })
  }

  return matches
}

module.exports = getRecentMatches
