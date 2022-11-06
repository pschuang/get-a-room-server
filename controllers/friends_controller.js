require('dotenv').config
const Friends = require('../models/friend_model')
// const cache = require('../util/cache')

const getFriends = async (req, res) => {
  const { userId } = req.params
  // fake data
  //   const friends = [
  //     {
  //       userId: 3,
  //       roomId: '5566',
  //       nickname: 'Japopo',
  //       pictureURL: 'https://pschuang.github.io/images/capybara.svg',
  //     },
  //     {
  //       userId: 4,
  //       roomId: '5678',
  //       nickname: 'Shiela',
  //       pictureURL:
  //         'https://i.pinimg.com/736x/e1/ad/40/e1ad406c381e4788ef6851e95d677afc.jpg',
  //     },
  //     {
  //       userId: 5,
  //       roomId: '5566',
  //       nickname: 'Ramona',
  //       pictureURL: 'https://avatars.githubusercontent.com/u/105725219?v=4',
  //     },
  //   ]

  // call model
  const friends = await Friends.getFriends(userId)

  res.json({ friends })
}

module.exports = { getFriends }
