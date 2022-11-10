const db = require('./mysqlconf')
const bcrypt = require('bcrypt')
const salt = parseInt(process.env.BCRYPT_SALT)
const { TOKEN_EXPIRE, TOKEN_SECRET } = process.env // 30 days by seconds
const jwt = require('jsonwebtoken')

const signUp = async (name, nickname, email, password, pictureId) => {
  const conn = await db.getConnection()

  try {
    // check if email exists
    const [checkEmail] = await conn.query(
      'SELECT * FROM user WHERE email = ?',
      [email]
    )

    if (checkEmail.length != 0) {
      throw new Error('This email already exists.')
    }

    const user = {
      name,
      nickname,
      email,
      password: bcrypt.hashSync(password, salt),
      picture_id: pictureId,
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

module.exports = {
  signUp,
}
