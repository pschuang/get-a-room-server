require('dotenv').config
const validator = require('validator')
const User = require('../models/user_model')

const signUp = async (req, res) => {
  // 收到使用者註冊資訊
  const { name, nickname, email, password, confirm_password, picture_id } =
    req.body
  if (
    !name ||
    !nickname ||
    !email ||
    !password ||
    !confirm_password ||
    !picture_id
  ) {
    res.status(400).send({ error: 'All fields for sign up are required.' })
    return
  }

  if (!validator.isEmail(email)) {
    res.status(400).send({ error: 'Invalid email format' })
    return
  }

  if (password !== confirm_password) {
    res.status(400).send({ error: 'Passwords are not matching' })
    return
  }

  if (!validator.isStrongPassword(password)) {
    res.status(400).send({ error: 'Please use stronger password' })
    return
  }

  const result = await User.signUp(name, nickname, email, password, picture_id)

  const { user, error, status } = result
  if (error) {
    res.status(status).json({ error: result.error })
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
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required.' })
    return
  }

  const result = await User.signIn(email, password)

  const { user, error, status } = result
  if (error) {
    const statuscode = status ? status : 500
    res.status(statuscode).json({ error: error })
    return
  }

  if (!user) {
    res.status(500).json({ message: 'Database query error.' })
    return
  }

  const data = {
    access_token: user.access_token,
    user: {
      id: user.id,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      picture_id: user.picture_id,
    },
  }
  res.json(data)
}

const signOut = async (req, res) => {
  //
}

const getUserInfo = async (req, res) => {
  const userId = req.user.id
  const user = await User.getUserInfo(userId)
  res.json(user)
}

module.exports = {
  signUp,
  signIn,
  signOut,
  getUserInfo,
}
