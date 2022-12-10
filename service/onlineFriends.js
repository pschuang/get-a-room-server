const Friends = require('../models/friends_model')

const getOnlineFriendList = async (userId, onlineUsers) => {
  const friends = await Friends.getFriends(userId)
  const onlineFriends = friends
    .map((friend) => friend?.userId)
    .filter((friendId) => onlineUsers.includes(friendId.toString()))

  return onlineFriends
}

module.exports = getOnlineFriendList

