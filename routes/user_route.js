const router = require('express').Router()

const { authentication, wrapAsync } = require('../util/util')

const {
  signUp,
  signIn,
  signOut,
  getUserInfo,
} = require('../controllers/user_controller')

router.route('/user/signup').post(wrapAsync(signUp))
router.route('/user/signin').post(wrapAsync(signIn))
router.route('/user/signout').post(signOut)
router.route('/user/info').get(authentication, wrapAsync(getUserInfo))

module.exports = router
