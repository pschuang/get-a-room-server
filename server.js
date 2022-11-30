require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const app = require('./app')
const server = http.createServer(app)

const {
  PORT,
  TOKEN_SECRET,
  MATCH_CHATROOM_TIME_SPAN,
  DECIDE_TO_BE_FRIEND_TIME_SPAN,
} = process.env
const { v4: uuidv4 } = require('uuid')
const redis = require('./util/cache')
const jwt = require('jsonwebtoken')
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const Chatroom = require('./models/chatroom_model')
const Questions = require('./models/questions_model')
const Friends = require('./models/friends_model')
const Admin = require('./models/admin_model')
const EXPIRE_TIME = 24 * 60 * 60 // match 和 room 的 redis key expire 時間先設定 30 秒 之後要改成 24 hr

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

let users = {}
let countOfClinents = 0
io.use((socket, next) => {
  try {
    const user = jwt.verify(socket.handshake.auth.token, TOKEN_SECRET)
    socket.user = user
    next()
  } catch (err) {
    console.log(err)
    const authError = new Error('not authorized')
    next(authError)
  }
})

io.on('connection', async (socket) => {
  // 紀錄 user 的 socket
  users[socket.user.id] = socket
  console.log('users on connection:', Object.keys(users))

  // count the current connections
  countOfClinents++
  io.emit('online-count', countOfClinents)

  // ======== EVENTS ========= //
  // disconnect
  socket.on('disconnect', async () => {
    countOfClinents--
    console.log('someone disconnected, now connection count: ', countOfClinents)
    io.emit('online-count', countOfClinents)

    // 如果有在即時聊天室，通知對方已離線
    const roomId = await redis.get('user:' + socket.user.id)

    if (roomId) {
      const result = await redis.hget('room:' + roomId, 'members')

      const members = JSON.parse(result)
      const counterpart = members.filter((user) => user != socket.user.id)
      console.log('counterpart: ', counterpart)
      if (users[counterpart])
        users[counterpart].emit('counterpart-left-chatroom')
    }
    delete users[socket.user.id]
  })

  // 收到訊息後轉發同個聊天室
  socket.on('send-message', async (msg) => {
    // msg: {roomId: xxx, message: 'hello', userId: 13}
    if (!msg.roomId) {
      socket.emit('room-not-exist', { message: 'room not exist' })
      return
    }

    // 1. 自己管 room
    const result = await redis.hget('room:' + msg.roomId, 'members')

    const members = JSON.parse(result)
    if (!members) {
      socket.emit('room-not-exist', { message: 'room not exist' })
      return
    }

    if (members[0] == socket.user.id) {
      users[members[1]].emit('receive-message', {
        userId: msg.userId,
        message: msg.message,
        created_at: dayjs().utc().format('YYYY-MM-DD HH:mm:ss'),
      })
    } else if (members[1] == socket.user.id) {
      users[members[0]].emit('receive-message', {
        userId: msg.userId,
        message: msg.message,
        created_at: dayjs().utc().format('YYYY-MM-DD HH:mm:ss'),
      })
    } else {
      console.error('sth wrong....')
    }
  })

  // 收到 send-message-to-friend 後轉發
  socket.on('send-message-to-friend', (data) => {
    const { roomId, message } = data

    // 寫進資料庫
    Chatroom.createMessage(socket.user.id, message, roomId)

    // 轉發
    socket.to(roomId).emit('receive-message-from-friend', {
      userId: socket.user.id,
      message,
      created_at: dayjs().utc().format('YYYY-MM-DD HH:mm:ss'),
    })
  })

  // client 端點擊 repliers 發送 create room 事件後
  socket.on('create-room', async (data) => {
    // 如果前端選的 user 目前不在線上，則不能建立聊天室
    if (!users[data.counterpart]) {
      socket.emit('create-room-fail', {
        message: `could not find ${data.counterpart}`,
      })
      return
    }

    // 判斷選擇的人是不是已經配對過
    const matchList = await redis.lrange('match-list', 0, -1)
    if (matchList.includes(data.counterpart.toString())) {
      socket.emit('create-room-fail', {
        message: `user ${data.counterpart} has been matched.`,
      })
      return
    }

    // 1. 自己管理 room
    let roomId = uuidv4()
    // {1234: {
    //   "members" : [1, 2],
    //   'created_at' : '2022/11/4 13:30'
    // }

    // 紀錄配對聊天室 roomId, 雙方 user_id, 開始聊天時間
    const roomData = {
      members: JSON.stringify([socket.user.id, data.counterpart]),
      created_dt: dayjs().utc().format('YYYY-MM-DD HH:mm:ss'),
    }

    await redis.hmset('room:' + roomId, roomData)
    await redis.expire('room:' + roomId, EXPIRE_TIME)

    // 紀錄已配對成功的人
    await redis.lpush('match-list', [socket.user.id, data.counterpart])
    await redis.expire('match-list', EXPIRE_TIME)

    // 紀錄使用者的聊天室 room_id，以便離線的時候可以通知另一方
    await redis.set('user:' + socket.user.id, roomId)
    await redis.set('user:' + data.counterpart, roomId)
    await redis.expire('user:' + socket.user.id, EXPIRE_TIME)
    await redis.expire('user:' + data.counterpart, EXPIRE_TIME)

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
      time: dayjs().utc().format('YYYY-MM-DD HH:mm:ss'),
    })

    // questions table 的 is_closed 改成 1
    await Questions.closeQuestion(parseInt(data.questionId))
  })

  // 被選者答應加入聊天
  socket.on('counterpart-join-match-room', async ({ roomId, counterpart }) => {
    const matchEndTime = dayjs()
      .utc()
      .add(MATCH_CHATROOM_TIME_SPAN / 1000, 'second')
      .format('YYYY-MM-DD HH:mm:ss')

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
        const lengthOfAgreeList = await redis.llen(roomId)
        if (lengthOfAgreeList < 2) {
          socket.emit('be-friends-fail')
          users[counterpart].emit('be-friends-fail')
        }
      }, DECIDE_TO_BE_FRIEND_TIME_SPAN)
    }, MATCH_CHATROOM_TIME_SPAN)
  })

  // client 端點擊好友發送 join-room 事件
  socket.on('join-room', async (data) => {
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
  })

  // client 發送 agree-to-be-friends 事件
  socket.on('agree-to-be-friend', async ({ roomId, userId }) => {
    // 在 redis 紀錄
    const lengthOfAgreeList = await redis.llen(roomId)
    if (lengthOfAgreeList === 0) {
      await redis.lpush(roomId, userId)
      await redis.expire(roomId, EXPIRE_TIME)
    }
    if (lengthOfAgreeList === 1) {
      await redis.lpush(roomId, userId)
      // 找到聊天對象 user_id
      const result = await redis.hget('room:' + roomId, 'members')
      const members = JSON.parse(result)
      await Friends.createFriendship(roomId, members)
      // 通知雙方已成為好友
      members.forEach((member) => {
        users[member].emit('be-friends-success')
      })
    }
  })

  // 加入 dashboard 事件
  socket.on('join-recent-matches-notify-room', () => {
    const currentRooms = Array.from(socket.rooms)
    socket.leaveAll()
    socket.join('recent-matches-notify-room')
  })

  // refresh dashboard event
  socket.on('refresh-dashboard', async () => {
    // 收到前端請求後，從 model 拿資料並回傳
    const askedQuestionCount = await Admin.getAskedQuestionCount()
    const openQuestionCount = await Admin.getOpenQuestionCount()
    const questionCountByCategory = await Admin.getQuestionsCountByCategory()
    const userCount = await Admin.getUserCount()
    const friendshipCount = await Admin.getFriendshipCount()
    const replyCount = await Admin.getReplyCount()
    socket.emit('refresh-dashboard-success', {
      askedQuestionCount,
      openQuestionCount,
      questionCountByCategory,
      userCount,
      friendshipCount,
      replyCount,
    })
  })

  // 紀錄 page views => 在 redis 紀錄
  await redis.lpush('page-view-list', socket.user.id)
})

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`)
})
