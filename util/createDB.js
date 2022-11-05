require('dotenv').config({ path: '../.env' })
const db = require('../models/mysqlconf')

const createTable = async () => {
  const [result] = await db.query('select * from product')
  console.log(result)
}

createTable()
