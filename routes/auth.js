const express = require("express")

const authController = require('../controllers/auth');
const isAuthenticated = require("../middleware/is-auth")

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);

router.post('/logout', isAuthenticated, authController.postLogout);

router.get("/email-reset-pass", authController.getEmailResetPassword)
router.post("/email-reset-pass", authController.postEmailResetPassword)

router.get("/email-sent", authController.getEmailSent)

router.get("/reset-pass/:uuid", authController.getResetPassword)
router.post("/reset-pass", authController.postResetPassword)

router.get("/password-changed", authController.getPasswordChanged)

router.get("/account", authController.getAccountPage)

router.get("/edit-account-details", authController.getEditAccount)
router.post("/edit-account-details", authController.postEditAccount)

router.get("/delete-account", authController.deleteAccount)

module.exports = router;
