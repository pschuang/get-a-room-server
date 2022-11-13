require('dotenv').config()
const { TOKEN_SECRET } = process.env
const jwt = require('jsonwebtoken')

const wrapAsync = (fn) => {
  return function (req, res, next) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res, next).catch(next)
  }
}

const authentication = async (req, res, next) => {
  let accessToken = req.get('Authorization')
  if (!accessToken) {
    res.status(401).json({ message: 'token is required' })
    return
  }

  try {
    accessToken = accessToken.split(' ')[1]
    const user = jwt.verify(accessToken, TOKEN_SECRET)
    console.log('user: ', user)
    req.user = user
    next()
  } catch (error) {
    res.status(403).json({ message: error.message })
    return
  }
}

module.exports = {
  wrapAsync,
  authentication,
}
