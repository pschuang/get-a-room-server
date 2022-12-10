require('dotenv').config()
const {
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
} = require('./socket_controllers/main_controller')

const {
  getOnlineCounts,
  refreshDashboard,
} = require('./socket_controllers/admin_controller')

const http = require('http')
const { Server } = require('socket.io')
const app = require('./app')
const server = http.createServer(app)

const { PORT, TOKEN_SECRET } = process.env
const redis = require('./util/cache')
const jwt = require('jsonwebtoken')

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

let users = {}
let countOfClients = 0
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
  console.log('online users:', Object.keys(users))

  onlineNotifyFriends(socket, users)

  // count the current connections
  countOfClients++
  io.emit('online-count', { onlineCounts: countOfClients })

  // ======== EVENTS ========= //
  // 進入 dashboard 之後取得在線人數
  socket.on('get-online-count', async () => {
    getOnlineCounts(socket, countOfClients)
  })

  // 上線時，回傳給自己 自己的在線好友
  socket.on('get-online-friends', async () => {
    getOnlineFriends(socket, users)
  })

  // disconnect
  socket.on('disconnect', async () => {
    // dashboard 連線數量-1
    countOfClients--
    io.emit('online-count', { onlineCounts: countOfClients })

    disconnectNotifyFriends(socket, users)
    notifyCounterpartLeft(socket, users)

    delete users[socket.user.id]
  })

  // 收到訊息後轉發同個聊天室
  socket.on('send-message', (msg) => {
    sendMessage(socket, users, msg)
  })

  // 收到 send-message-to-friend 後轉發
  socket.on('send-message-to-friend', (data) => {
    sendMessageToFriend(socket, data)
  })

  // client 端點擊 repliers 發送 create room 事件後
  socket.on('create-room', (data) => {
    createRoom(socket, users, data)
  })

  // 被選者答應加入聊天
  socket.on('counterpart-join-match-room', ({ roomId, counterpart }) => {
    startMatchChatRoom(socket, users, roomId, counterpart)
  })

  // client 端點擊好友發送 join-room 事件
  socket.on('join-room', (data) => {
    joinRoom(socket, data)
  })

  // client 發送 agree-to-be-friends 事件
  socket.on('agree-to-be-friend', async ({ roomId, userId }) => {
    makeFriends(users, roomId, userId)
  })

  // 加入 dashboard 事件
  socket.on('join-recent-matches-notify-room', () => {
    socket.leaveAll()
    socket.join('recent-matches-notify-room')
  })

  // refresh dashboard event
  socket.on('refresh-dashboard', async () => {
    refreshDashboard(socket)
  })

  // 接到新回覆，通知問問題的人
  socket.on('create-reply', ({ questionOwnerId }) => {
    if (users[questionOwnerId]) {
      users[questionOwnerId].emit('new-reply')
    }
  })

  // 紀錄 page views => 在 redis 紀錄
  await redis.lpush('page-view-list', socket.user.id)
})

server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`)
})
