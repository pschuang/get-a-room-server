require('dotenv').config({ path: __dirname + '/../.env' })
const redis = require('./cache')
const db = require('../models/mysqlconf')
const dayjs = require('dayjs')
var utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const updatePageView = async () => {
  const todayDateUTC = dayjs().utc().format('YYYY-MM-DD')

  // 取得 page views count per hour
  const pageViewsCount = await redis.llen('page-view-list')
  console.log(pageViewsCount)

  // 寫進 DB
  const [today] = await db.execute('SELECT * FROM page_views WHERE time = ?', [
    todayDateUTC,
  ])
  if (today.length === 0) {
    await db.execute('INSERT INTO page_views (views, time) VALUES( ? , ?)', [
      pageViewsCount,
      todayDateUTC,
    ])
    console.log('inserted new date in DB successfully!')
    await redis.del('page-view-list')
  } else {
    console.log('record for today exists...')
    const newPageViews = today[0].views + pageViewsCount
    await db.execute('UPDATE page_views SET views = ? WHERE time = ?', [
      newPageViews,
      todayDateUTC,
    ])
    await redis.del('page-view-list')
  }
  await redis.disconnect()
  await db.end()
}

updatePageView()
