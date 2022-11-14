const router = require('express').Router()

const { authentication } = require('../util/util')

const {
  signUp,
  signIn,
  signOut,
  getUserInfo,
} = require('../controllers/user_controller')

router.route('/user/signup').post(signUp)
router.route('/user/signin').post(signIn)
router.route('/user/signout').post(signOut)
router.route('/user/info').get(authentication, getUserInfo)

module.exports = router
