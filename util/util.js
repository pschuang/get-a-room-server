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
  console.log('Now in authentication')
  let accessToken = req.get('Authorization')
  console.log('access token before:', accessToken)
  if (!accessToken) {
    res.status(401).json({ message: 'token is required' })
    return
  }

  try {
    accessToken = accessToken.split(' ')[1]
    console.log('access token after:', accessToken)
    const user = jwt.verify(accessToken, TOKEN_SECRET)
    console.log('user: ', user)

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
