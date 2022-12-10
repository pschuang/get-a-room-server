require('dotenv').config({ path: '../.env' })
const Chatroom = require('../models/chatroom_model')
const Friends = require('../models/friends_model')
const Questions = require('../models/questions_model')
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)
const EXPIRE_TIME = 24 * 60 * 60 // match 和 room 的 redis key expire 時間先設定 30 秒 之後要改成 24 hr
const { v4: uuidv4 } = require('uuid')
const {
  currentUTCDateTime,
  addTimeBySecond,
} = require('../util/convertDatetime')
const { MATCH_CHATROOM_TIME_SPAN, DECIDE_TO_BE_FRIEND_TIME_SPAN } = process.env
const getOnlineFriendList = require('../service/onlineFriends')

const Cache = require('../models/cache_model')

const getOnlineFriends = async (socket, users) => {
  const onlineFriendList = await getOnlineFriendList(
    socket.user.id,
    Object.keys(users)
  )
  socket.emit('online-friends', onlineFriendList)
}

const onlineNotifyFriends = async (socket, users) => {
  // 將所有在線上的好友的 user id 回傳
  const onlineFriendList = await getOnlineFriendList(
    socket.user.id,
    Object.keys(users)
  )

  // 上線時，回傳給在線好友他們的在線好友
  if (onlineFriendList.length != 0) {
    onlineFriendList.forEach(async (onlineFriend) => {
      const onlineFriendIds = await getOnlineFriendList(
        onlineFriend,
        Object.keys(users)
      )
      users[onlineFriend].emit('a-friend-connect', onlineFriendIds)
    })
  }
}

const disconnectNotifyFriends = async (socket, users) => {
  const onlineFriendList = await getOnlineFriendList(
    socket.user.id,
    Object.keys(users)
  )

  // 離線時，回傳給在線好友他們的在線好友 (除了自己)
  if (onlineFriendList.length != 0) {
    onlineFriendList.forEach(async (onlineFriend) => {
      const onlineFriendIds = await getOnlineFriendList(
        onlineFriend,
        Object.keys(users)
      )
      const onlineFriendIdsWithOutMe = onlineFriendIds.filter(
        (onlineFriendId) => onlineFriendId != socket.user.id
      )
      users[onlineFriend]?.emit('a-friend-disconnect', onlineFriendIdsWithOutMe)
    })
  }
}

const notifyCounterpartLeft = async (socket, users) => {
  // 如果有在即時聊天室，通知對方已離線
  const roomId = await Cache.getRoomId(socket.user.id)

  if (roomId) {
    const result = await Cache.getMembers(roomId)

    const members = JSON.parse(result)
    const counterpart = members?.filter((user) => user != socket.user.id)
    if (users[counterpart]) users[counterpart].emit('counterpart-left-chatroom')
  }
}

const sendMessage = async (socket, users, msg) => {
  // msg: {roomId: xxx, message: 'hello', userId: 13}
  if (!msg.roomId) {
    socket.emit('room-not-exist', { message: 'room not exist' })
    return
  }

  // 1. 自己管 room
  const result = await Cache.getMembers(msg.roomId)

  const members = JSON.parse(result)
  if (!members) {
    socket.emit('room-not-exist', { message: 'room not exist' })
    return
  }

  if (members[0] == socket.user.id) {
    users[members[1]].emit('receive-message', {
      userId: msg.userId,
      message: msg.message,
      created_at: currentUTCDateTime(),
    })
  } else if (members[1] == socket.user.id) {
    users[members[0]].emit('receive-message', {
      userId: msg.userId,
      message: msg.message,
      created_at: currentUTCDateTime(),
    })
  } else {
    console.error('sth wrong....')
  }
}

const sendMessageToFriend = (socket, data) => {
  const { roomId, message } = data

  // 寫進資料庫
  Chatroom.createMessage(socket.user.id, message, roomId)

  // 轉發
  socket.to(roomId).emit('receive-message-from-friend', {
    userId: socket.user.id,
    message,
    created_at: currentUTCDateTime(),
  })
}

const createRoom = async (socket, users, data) => {
  // 如果前端選的 user 目前不在線上，則不能建立聊天室
  if (!users[data.counterpart]) {
    socket.emit('create-room-fail', {
      message: `could not find ${data.counterpart}`,
    })
    return
  }

  // 判斷選擇的人是不是已經配對過
  const matchList = await Cache.getMatchList()
  if (matchList.includes(data.counterpart.toString())) {
    socket.emit('create-room-fail', {
      message: `user ${data.counterpart} has been matched.`,
    })
    return
  }

  // 自己管理 room
  let roomId = uuidv4()

  // 紀錄配對聊天室 roomId, 雙方 user_id, 開始聊天時間
  const roomData = {
    members: JSON.stringify([socket.user.id, data.counterpart]),
    created_dt: currentUTCDateTime(),
  }

  Cache.setMatchChatRoomInfo(roomId, roomData, EXPIRE_TIME)

  // 紀錄已配對成功的人
  Cache.addUsersToMatchList(socket.user.id, data.counterpart, EXPIRE_TIME)

  // 紀錄使用者的聊天室 room_id，以便離線的時候可以通知另一方
  Cache.setUserWithRoomId(socket.user.id, roomId, EXPIRE_TIME)
  Cache.setUserWithRoomId(data.counterpart, roomId, EXPIRE_TIME)

  socket.emit('create-room-ok', { roomId, counterpart: data.counterpart }) // 回傳給自己 roomId 以及聊天對象 id

  users[data.counterpart].emit('create-room-ok', {
    // 回傳給聊天對象 roomId 以及 自己的 id
    roomId,
    counterpart: parseInt(socket.user.id),
    isPassive: true, // 被選中的人是多回傳 isPassive: true
  })

  // 推播到 dashboard
  socket.to('recent-matches-notify-room').emit('recent-match', {
    users: [socket.user.id, data.counterpart],
    time: currentUTCDateTime(),
  })

  // questions table 的 is_closed 改成 1
  await Questions.closeQuestion(parseInt(data.questionId))
}

const startMatchChatRoom = async (socket, users, roomId, counterpart) => {
  const matchEndTime = addTimeBySecond(
    currentUTCDateTime(),
    MATCH_CHATROOM_TIME_SPAN / 1000
  )

  // 傳送結束時間給雙方前端
  socket.emit('match-end-time', matchEndTime)
  users[counterpart].emit('match-end-time', matchEndTime)

  // 通知發問題的人: 被選者已加入
  users[counterpart].emit('counterpart-has-joined')

  // 15 分鐘後結束聊天室
  setTimeout(() => {
    socket.emit('match-time-end', { DECIDE_TO_BE_FRIEND_TIME_SPAN })
    users[counterpart].emit('match-time-end', {
      DECIDE_TO_BE_FRIEND_TIME_SPAN,
    })
    // 結束聊天後，1 分鐘後再檢查
    setTimeout(async () => {
      const lengthOfAgreeList = await Cache.getLengthOfAgreeList(roomId)
      if (lengthOfAgreeList < 2) {
        socket.emit('be-friends-fail')
        users[counterpart].emit('be-friends-fail')
      }
    }, DECIDE_TO_BE_FRIEND_TIME_SPAN)
  }, MATCH_CHATROOM_TIME_SPAN)
}

const joinRoom = async (socket, data) => {
  const { roomId } = data
  // 從 jwt 拿到 userid & 從前端拿到 roomid之後，確認此 user 有沒有權限加入 room
  const canJoinRoom = await Chatroom.checkUserAuth(socket.user.id, roomId)

  if (!canJoinRoom) {
    socket.emit('join-room-fail', {
      message: `not authorized to join room ${roomId}`,
    })
    return
  }

  // JOIN 另外一個 room 之前要先離開其他 rooms (但要保留自己的 socket.id 的那個 room)
  const currentRooms = Array.from(socket.rooms)

  const filteredRooms = currentRooms.filter((room) => room !== socket.id)
  filteredRooms.forEach((room) => {
    socket.leave(room)
  })

  socket.join(roomId)
}

const makeFriends = async (users, roomId, userId) => {
  // 在 redis 紀錄
  const lengthOfAgreeList = await Cache.getLengthOfAgreeList(roomId)
  if (lengthOfAgreeList === 0) {
    Cache.addUserToAgreeList(roomId, userId, EXPIRE_TIME)
  }
  if (lengthOfAgreeList === 1) {
    Cache.addUserToAgreeList(roomId, userId, EXPIRE_TIME)
    // 找到聊天對象 user_id
    const result = await Cache.getMembers(roomId)
    const members = JSON.parse(result)
    await Friends.createFriendship(roomId, members)
    // 通知雙方已成為好友
    members.forEach((member) => {
      users[member].emit('be-friends-success')
    })
  }
}

module.exports = {
  getOnlineFriends,
  onlineNotifyFriends,
  disconnectNotifyFriends,
  notifyCounterpartLeft,
  sendMessage,
  sendMessageToFriend,
  createRoom,
  startMatchChatRoom,
  joinRoom,
  makeFriends,
}
