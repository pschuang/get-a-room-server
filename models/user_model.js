const db = require('./mysqlconf')
const bcrypt = require('bcrypt')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds
const jwt = require('jsonwebtoken')
const { currentUTCDateTime } = require('../util/convertDatetime')

const signUp = async (name, nickname, email, password, pictureId) => {
  const conn = await db.getConnection()

  try {
    // check if email exists
    const [checkEmail] = await conn.query(
      'SELECT * FROM user WHERE email = ?',
      [email]
    )

    if (checkEmail.length != 0) {
      return { error: 'This email already exists.', status: 403 }
    }

    const user = {
      name,
      nickname,
      email,
      password: bcrypt.hashSync(password, salt),
      picture_id: pictureId,
      created_at: currentUTCDateTime(),
    }

    const accessToken = jwt.sign(
      {
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        picture_id: user.picture_id,
      },
      TOKEN_SECRET,
      {
        expiresIn: TOKEN_EXPIRE,
      }
    )

    // sign user up
    const [result] = await conn.query('INSERT INTO user SET?', user)
    user.id = result.insertId
    user.access_token = accessToken
    return { user }
  } catch (e) {
    console.log(e)
    return { error: e.message }
  } finally {
    await conn.release()
  }
}

const signIn = async (email, password) => {
  const conn = await db.getConnection()
  try {
    const [users] = await conn.query('SELECT * FROM user WHERE email = ?', [
      email,
    ])
    if (users.length === 0) {
      return { error: 'cannot find email', status: 400 }
    }
    const user = users[0]
    if (!bcrypt.compareSync(password, user.password)) {
      return { error: 'Wrong password', status: 403 }
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
        picture_id: user.picture_id,
        role: user.role,
      },
      TOKEN_SECRET,
      {
        expiresIn: TOKEN_EXPIRE,
      }
    )

    user.access_token = accessToken

    return { user }
  } catch (e) {
    return { error: e.message }
  } finally {
    await conn.release()
  }
}

const signOut = async () => {
  //
}

const getUserInfo = async (userId) => {
  const [user] = await db.execute(
    'SELECT user.id, user.nickname, user.role,  picture.picture_URL FROM user, picture WHERE user.picture_id = picture.id AND user.id = ?',
    [userId]
  )
  return user[0]
}

module.exports = {
  signUp,
  signIn,
  signOut,
  getUserInfo,
}
