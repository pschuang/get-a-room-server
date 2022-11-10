require('dotenv').config({ path: '../.env' })
const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env

const db = require('../models/mysqlconf')

// const mysql = require('mysql2/promise')
// const db = mysql.createPool({
//   host: DB_HOST,
//   user: DB_USERNAME,
//   password: DB_PASSWORD,
//   database: 'stylish_backend',
// })

const getTime = async () => {
  const [times] = await db.query(`select * from time`)
  console.log(times)

  const time = times[0].time
  console.log('time', time)
  const datetime = new Date(times[0].datetime)
  const datetime2 = new Date(times[1].datetime)
  console.log('datetime: ', datetime)
  console.log('datetime: ', datetime.toLocaleString())
  console.log('datetime2: ', datetime2)
  console.log('datetime2: ', datetime2.toLocaleString())

  console.log('datetime - time in mins: ', (datetime - time) / 60000)
  console.log('datetime2 - datetime in mins: ', (datetime2 - datetime) / 60000)
}

const insertTime = async () => {
  const datetime = Date.now()
  await db.query(`UPDATE time SET datetime = ? WHERE id = ?`, [datetime, 16])
}

const getDateTime = async () => {
  const [reply] = await db.query('SELECT * FROM replies WHERE id = 14')
  const time = reply[0].time
  console.log(reply)
  console.log(time)

  console.log(new Date(time).toLocaleString())
}

// insertTime()
// getTime()
getDateTime()
