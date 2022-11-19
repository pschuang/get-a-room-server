require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const app = require('./app')
const server = http.createServer(app)

const { PORT, TOKEN_SECRET } = process.env
const { v4: uuidv4 } = require('uuid')
const redis = require('./util/cache')
const jwt = require('jsonwebtoken')
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const Chatroom = require('./models/chatroom_model')
const Questions = require('./models/questions_model')
const EXPIRE_TIME = 30 // match 和 room 的 redis key expire 時間先設定 30 秒 之後要改成 24 hr

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

let users = {}
// io.use((socket, next) => {
//   console.log('the error middleware')
//   next(new Error('thou shall not pass'))
// })
io.use((socket, next) => {
  console.log('the socket auth middleware')
  // console.log('TOKEN:', socket.handshake.auth.token)
  // console.log('TOKEN:', socket.handshake.headers['Authorization'])
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

io.on('connection', (socket) => {
  console.log(`socket ${socket.id} is connected`)

  // 紀錄 user 的 socket
  users[socket.user.id] = socket
  console.log('users on connection:', Object.keys(users))

  // count the current connections
  const count = io.engine.clientsCount
  console.log(`${count}th user is connected`)

  // ======== EVENTS ========= //
  // disconnect
  socket.on('disconnect', () => {
    console.log('Got disconnected')
    delete users[socket.user.id]
    // console.log('users:', users)
  })

  // 收到訊息後轉發同個聊天室
  socket.on('send-message', async (msg) => {
    // msg: {roomId: xxx, message: 'hello', userId: 13}
    console.log('msg:', msg)

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

    console.log('redis members', members)
    // let members = rooms[msg.roomId].members
    console.log('members: ', members)
    if (members[0] == socket.user.id) {
      users[members[1]].emit('receive-message', {
        userId: msg.userId,
        message: msg.message,
      })
    } else if (members[1] == socket.user.id) {
      users[members[0]].emit('receive-message', {
        userId: msg.userId,
        message: msg.message,
      })
    } else {
      console.error('sth wrong....')
    }
  })

  // 收到 send-message-to-friend 後轉發
  socket.on('send-message-to-friend', (data) => {
    console.log('send-message-to-friend: ', data)
    const { roomId, message } = data

    // 寫進資料庫
    Chatroom.createMessage(socket.user.id, message, roomId)

    // 轉發
    socket
      .to(roomId)
      .emit('receive-message-from-friend', { userId: socket.user.id, message })
  })

  // client 端點擊 repliers 發送 create room 事件後
  socket.on('create-room', async (data) => {
    console.log('data: ', data)
    // data: {'counterpart': 2, questionId: 52}
    // 如果前端選的 user 目前不在線上，則不能建立聊天室
    if (!users[data.counterpart]) {
      socket.emit('create-room-fail', {
        message: `could not find ${data.counterpart}`,
      })
      return
    }

    // questions table 的 is_closed 改成 1
    await Questions.closeQuestion(parseInt(data.questionId))

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
    await redis.expire('room:' + roomId, EXPIRE_TIME) // 設定

    console.log('roomData: ', roomData)

    // 紀錄已配對成功的人
    await redis.lpush('match-list', [socket.user.id, data.counterpart])
    await redis.expire('match-list', EXPIRE_TIME) // 設定

    socket.emit('create-room-ok', { roomId, counterpart: data.counterpart }) // 回傳給自己 roomId 以及聊天對象 id

    users[data.counterpart].emit('create-room-ok', {
      // 回傳給聊天對象 roomId 以及 自己的 id
      roomId,
      counterpart: parseInt(socket.user.id),
      isPassive: true, // 被選中的人是多回傳 isPassive: true
    })

    // TODO: 15 分鐘後結束聊天室
    // setTimeout(() => {
    //   socket.emit('match-time-end')
    //   users[data.counterpart].emit('match-time-end')
    // }, 7000)
  })

  // client 端點擊好友發送 join-room 事件
  socket.on('join-room', async (data) => {
    console.log('receive join-room event...')
    console.log('data: ', data)
    console.log('socket.user: ', socket.user)
    console.log('socket rooms before: ', socket.rooms)
    const { roomId } = data
    // 從 jwt 拿到 userid & 從前端拿到 roomid之後，確認此 user 有沒有權限加入 room
    const canJoinRoom = await Chatroom.checkUserAuth(socket.user.id, roomId)

    console.log(`user: ${socket.user.id} wants to join room ${roomId}`)
    console.log('can join room: ', canJoinRoom)
    if (!canJoinRoom) {
      socket.emit('join-room-fail', {
        message: `not authorized to join room ${roomId}`,
      })
      console.log(`cannot join`)
      return
    }
    // JOIN 另外一個 room 之前要先離開其他 rooms (但要保留自己的 socket.id 的那個 room)

    const currentRooms = Array.from(socket.rooms)
    console.log(currentRooms)

    const filteredRooms = currentRooms.filter((room) => room !== socket.id)
    filteredRooms.forEach((room) => {
      socket.leave(room)
    })

    socket.join(roomId)
    console.log('socket rooms after: ', socket.rooms)

    // socket.emit('join-room-ok')
  })
})

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`)
})
