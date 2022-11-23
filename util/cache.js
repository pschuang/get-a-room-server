const Redis = require('ioredis')
require('dotenv').config({ path: '../.env' })
const { CACHE_PORT, CACHE_HOST, CACHE_USER, CACHE_PASSWORD } = process.env

const redis = new Redis({
  port: CACHE_PORT,
  host: CACHE_HOST,
  username: CACHE_USER,
  password: CACHE_PASSWORD,
  showFriendlyErrorStack: true,
  retryStrategy: function () {
    const delay = 5
    return delay
  },
})

redis.ready = false
redis.on('ready', async () => {
  redis.ready = true
  console.log('Redis is ready')
})

redis.on('error', async () => {
  if (redis.ready) {
    console.error('Error in Redis')
    console.error('Redis lose connection')
  }
  redis.ready = false
})

const clearRedis = async () => {
  if (redis.ready) {
    console.warn('Cleaning Redis!!!')
    await redis.flushdb()
  }
}

// express 起來 但 redis 是關閉的狀態
const testRedisConnection = async () => {
  if (!redis.ready) {
    redis.connect().catch((err) => {
      console.log(err)
      console.log('redis connect fail')
    })
  }
}

setTimeout(testRedisConnection, 500)
// setTimeout(clearRedis, 400);
module.exports = redis
