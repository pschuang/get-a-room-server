require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const app = require('./app')
const server = http.createServer(app)

const { PORT } = process.env
const { v4: uuidv4 } = require('uuid')
const Chatroom = require('./models/chatroom_model')

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

// rooms
let rooms = {}
let users = {}
io.on('connection', (socket) => {
  console.log(`socket ${socket.id} is connected`)

  // disconnect
  socket.on('disconnect', () => {
    console.log('Got disconnected')
    delete users[socket.user_id]
    console.log(users)
    // TODO: handle rooms 要把已經不在的 room 刪掉
    console.log(rooms)
  })

  // count the current connections
  const count = io.engine.clientsCount
  console.log(`${count}th user is connected`)

  // 收到訊息後轉發同個聊天室
  socket.on('send-message', (msg) => {
    // msg: {roomId: xxx, message: 'hello'}
    console.log('msg:', msg)

    if (!msg.roomId) {
      console.log('no counterpart selected!')
      return
    }

    // 1. 自己管 room
    let members = rooms[msg.roomId].members
    console.log('members: ', members)
    if (members[0] == socket.user_id) {
      users[members[1]].emit('receive-message', {
        userId: msg.userId,
        message: msg.message,
      })
    } else if (members[1] == socket.user_id) {
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
    const { roomId, message, userId } = data

    // 寫進資料庫
    Chatroom.createMessage(userId, message, roomId)

    // 轉發
    socket.to(roomId).emit('receive-message-from-friend', { userId, message })
  })

  // 告訴 server 自己是哪個 user
  socket.on('user-id', (user_id) => {
    console.log('user id:', user_id)
    socket.user_id = user_id
    users[socket.user_id] = socket
  })

  // client 端點擊 repliers 發送 create room 事件後
  socket.on('create-room', (data) => {
    console.log('data: ', data)
    // data: {'counterpart': 2}
    // 如果前端選的 user 目前不在線上，則不能建立聊天室
    if (!users[data.counterpart]) {
      socket.emit('create-room-fail', {
        message: `could not find ${data.counterpart}`,
      })
      return
    }

    // 1. 自己管理 room
    let roomId = uuidv4()
    // {1234: {
    //   "members" : [1, 2],
    //   'created_at' : '2022/11/4 13:30'
    // }

    rooms[roomId] = {
      members: [parseInt(socket.user_id), data.counterpart],
      created_dt: Date.now(),
    }

    console.log('rooms: ', rooms)

    // 2. 讓 socket.io 管
    // socket.join(roomId)
    // users[data.couterpart].join(roomId)

    socket.emit('create-room-ok', { roomId, counterpart: data.counterpart }) // 回傳給自己 roomId 以及聊天對象 id

    users[data.counterpart].emit('create-room-ok', {
      // 回傳給聊天對象 roomId 以及 自己的 id
      roomId,
      counterpart: parseInt(socket.user_id),
      isPassive: true, // 被選中的人是多回傳 isPassive: true
    })
  })

  // client 端點擊好友發送 join-room 事件
  socket.on('join-room', (data) => {
    console.log('data: ', data)
    const { roomId } = data
    // TODO: 在 chatroom 點選另外一個朋友之後要leave 前一個 room 再 join 後一個 room
    // socket.leaveAll()
    socket.join(roomId)
    // socket.emit('join-room-ok')
  })
})

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`)
})