const redis = require('../util/cache')
const { currentUTCDate } = require('../util/convertDatetime')

const getRoomId = async (userId) => await redis.get('user:' + userId)

const getMembers = async (roomId) =>
  await redis.hget('room:' + roomId, 'members')

const getCreatedDt = async (roomId) =>
  await redis.hget('room:' + roomId, 'created_dt')

const setUserWithRoomId = (userId, roomId, expireTimeInSeconds) => {
  redis.set('user:' + userId, roomId, 'ex', expireTimeInSeconds)
}

const getMatchList = async () => await redis.lrange('match-list', 0, -1)

const setMatchChatRoomInfo = (roomId, roomData, expireTimeInSeconds) => {
  redis.hmset('room:' + roomId, roomData)
  redis.expire('room:' + roomId, expireTimeInSeconds)
}

const addUsersToMatchList = (userId, counterpartId, expireTimeInSeconds) => {
  redis.lpush('match-list', [userId, counterpartId])
  redis.expire('match-list', expireTimeInSeconds)
}

const getLengthOfAgreeList = async (roomId) => await redis.llen(roomId)

const addUserToAgreeList = (roomId, userId, expireTimeInSeconds) => {
  redis.lpush(roomId, userId)
  redis.expire(roomId, expireTimeInSeconds)
}

const addPageView = (userId) => redis.lpush('page-view-list', userId)

const getOpenTimeTodayUTC = async () => await redis.get(currentUTCDate())

const getValue = async (key) => await redis.get(key)

const getKeyListByPattern = async (pattern) => await redis.keys(pattern)

module.exports = {
  getRoomId,
  getMembers,
  getCreatedDt,
  setUserWithRoomId,
  getMatchList,
  setMatchChatRoomInfo,
  addUsersToMatchList,
  getLengthOfAgreeList,
  addUserToAgreeList,
  addPageView,
  getOpenTimeTodayUTC,
  getValue,
  getKeyListByPattern
}
