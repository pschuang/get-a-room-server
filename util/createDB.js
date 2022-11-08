require('dotenv').config({ path: '../.env' })
const db = require('../models/mysqlconf')

const createTable = async () => {
  const [result] = await db.query(
    `INSERT INTO messages (send_user_id, content, created_at, room_id) VALUES (5, 'gogogo!', convert_tz(UTC_TIMESTAMP(),'+00:00','+08:00'), 4567)`
  )

  console.log(result.insertId)
}

createTable()
