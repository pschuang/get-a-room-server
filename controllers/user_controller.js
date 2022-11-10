require('dotenv').config
const validator = require('validator')
const User = require('../models/user_model')

const signUp = async (req, res) => {
  // 收到使用者註冊資訊
  const { name, nickname, email, password, picture_id } = req.body
  if (!name || !nickname || !email || !password || !picture_id) {
    res
      .status(400)
      .send({ error: 'Request error: all fields for sign up are required.' })
    return
  }

  if (!validator.isEmail(email)) {
    res.status(400).send({ error: 'Request Error: Invalid email format' })
    return
  }

  const result = await User.signUp(name, nickname, email, password, picture_id)

  const { user, error } = result
  if (error) {
    res.status(403).json({ error: result.error })
    return
  }

  if (!user) {
    res.status(500).json({ error: 'Database query error.' })
    return
  }

  const data = {
    access_token: user.access_token,
    user: {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
    },
  }
  res.json(data)
}

const signIn = async (req, res) => {
  //
}

const signOut = async (req, res) => {
  //
}

module.exports = {
  signUp,
  signIn,
  signOut,
}
