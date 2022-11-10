const router = require('express').Router()

const { signUp, signIn, signOut } = require('../controllers/user_controller')

router.route('/user/signup').post(signUp)
router.route('/user/signin').post(signIn)
router.route('/user/signout').post(signOut)

module.exports = router
