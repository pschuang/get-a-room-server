require('dotenv').config()
const mysql = require('mysql2/promise')

const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
})

module.exports = db
