const bcrypt = require("bcryptjs")
const { v4: uuid4 } = require("uuid")
const { ObjectId } = require("mongodb")
const User = require('../models/user')
const Day = require('../models/day')
const getFlashMessage = require("../utils/getErrorFlash")
const sendResetPassMail = require("../utils/sendResetPassMail")
const sendActivateAccountMail = require("../utils/sendActivateAccountMail")
const store = require("../utils/MongoDbStore")
const { SESSIONS_COLLECTION, errorFlash, successFlash } = require("../utils/constants")

exports.getLogin = (req, res, _) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    errorMessage: getFlashMessage(req.flash(errorFlash))
  })
}

exports.postLogin = async (req, res, _) => {
  const { email, password } = req.body
  const user = await User.findOne({ email: email })
  if (!user) {
    req.flash(errorFlash, "Account doesn't exist")
    return res.redirect("/auth/login")
  }
  if (user.emailActivationUuid) {
    req.flash(errorFlash, "Your account is currently inactive. Check your email for the activation link.")
    return res.redirect("/auth/login")
  }
  const doMatch = await bcrypt.compare(password, user.password)
  if (doMatch) {
    req.session.isLoggedIn = true
    req.session.user = user
    return req.session.save(err => {
      err && console.log(err)
      return res.redirect('/')
    })
  }
  req.flash(errorFlash, "Invalid password")
  res.redirect("/auth/login")
}



exports.getSignup = (req, res, _) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: getFlashMessage(req.flash(errorFlash))
  });
};

exports.postSignup = async (req, res, _) => {
  if (req.body.password !== req.body.confirmPassword) {
    req.flash(errorFlash, "Passwords do not match")
    return res.redirect("/auth/signup")
  }
  const existingUser = await User.findOne({ email: req.body.email })
  if (existingUser) {
    req.flash(errorFlash, "User already exists")
    return res.redirect("/auth/signup")
  }
  const uuid = uuid4()
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 12)
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
      name: req.body.name,
      emailActivationUuid: uuid
    })
    await user.save()
    await sendActivateAccountMail(req.body.email, uuid)
    req.flash(successFlash, "An email with the confirmation link was sent to your email address. Consider checking the spam too.")
  } catch (error) {
    console.log(error)
    req.flash(errorFlash, "An error occured in the user creating process")
  }
  res.redirect("/auth/email-sent")
}

exports.postLogout = (req, res, _) => {
  req.session.destroy(err => {
    if (err) {
      req.flash(errorFlash, "Could not log you out")
      console.log(err)
    }
    res.redirect('/');
  })
}

exports.getEmailResetPassword = (req, res, _) => {
  res.render("auth/emailResetPass", {
    path: "/reset",
    pageTitle: "Request Reset Password",
    errorMessage: getFlashMessage(req.flash(errorFlash))
  })
}

exports.postEmailResetPassword = async (req, res, _) => {
  const uuid = uuid4()
  let email
  if (req.session.user) {
    email = req.session.user.email
  } else {
    email = req.body.email
  }
  const user = await User.findOne({ email: email })

  if (user) {
    user.passwordChangeUuid = uuid
    try {
      await user.save()
      await sendResetPassMail(email, uuid)
    } catch (error) {
      req.flash(errorFlash, "An error occured when trying to send the email. You may try again.")
      return res.redirect("/auth/email-reset-pass")
    }
  } else {
    req.flash(errorFlash, "No account was found for this email adddress.")
    return res.redirect("/auth/email-reset-pass")
  }
  req.flash(successFlash, "An email with the reset link was sent to your email address. Consider checking the spam too.")
  res.redirect("/auth/email-sent")
}

exports.getEmailSent = (req, res, _) => {
  res.render("auth/emailSent", {
    pageTitle: "Email sent",
    errorMessage: getFlashMessage(req.flash(errorFlash)),
    successMessage: getFlashMessage(req.flash(successFlash))
  })
}

exports.getResetPassword = (req, res, _) => {
  res.render("auth/resetPassFormPage", {
    pageTitle: "Reset password",
    uuid: req.params.uuid,
    errorMessage: getFlashMessage(req.flash(errorFlash))
  })

}

exports.postResetPassword = async (req, res, _) => {
  if (req.body.password !== req.body.confirmPassword) {
    req.flash(errorFlash, "Passwords do not match")
    return res.redirect("/auth/reset-pass/" + req.body.uuid)
  }
  const user = await User.findOne({ passwordChangeUuid: req.body.uuid })
  if (user) {
    const promisses = [
      bcrypt.hash(req.body.password, 12),
      user.updateOne({ $unset: { passwordChangeUuid: null } })
    ]
    const [newPassword, _] = await Promise.all(promisses)
    user.password = newPassword
    await user.save()
    req.flash(successFlash, "Password changed successfully!")
    return res.redirect("/auth/password-changed")
  }
  req.flash(errorFlash, "There is no user that requested a password change with this unique key.")
  res.redirect("/auth/reset-pass/" + req.body.uuid)
}

exports.getPasswordChanged = (req, res, _) => {
  res.render("auth/accountChangesResponse", {
    pageTitle: "Password changed",
    errorMessage: getFlashMessage(req.flash(errorFlash)),
    successMessage: getFlashMessage(req.flash(successFlash))
  })
}

exports.getActivateAccount = async (req, res, _) => {
  const { uuid } = req.params
  const user = await User.findOne({ emailActivationUuid: uuid })
  let errorMessage = null
  let successMessage = null
  if (!user) {
    errorMessage = "No account was found for this unique key"
  } else {
    try {
      await user.updateOne({ $unset: { emailActivationUuid: "" } })
      successMessage = "Your account is now active!"
    } catch (error) {
      console.log(error)
      errorMessage = "Some error occured during the activation process"
    }
  }

  res.render("auth/accountChangesResponse", {
    pageTitle: "Account activated",
    errorMessage: errorMessage,
    successMessage: successMessage
  })
}

exports.getAccountPage = (req, res, _) => {
  const bookings = []
  for (const booking of req.user.bookings) {
    const dateParts = booking.date.toString().split(" ")
    const newDateString = dateParts.slice(0, 4).join(" ")
    bookings.push({
      shortDate: newDateString,
      completeDate: booking.date,
      from: booking.from,
      until: booking.until,
      court: booking.court,
      price: booking.price,
      id: booking.id
    })
  }
  res.render("auth/account", {
    pageTitle: "Account page",
    errorMessage: getFlashMessage(req.flash(errorFlash)),
    successMessage: getFlashMessage(req.flash(successFlash)),
    username: req.session.user.name,
    email: req.session.user.email,
    bookings: bookings
  })
}

exports.getEditAccount = (req, res, _) => {
  res.render("auth/editAccount", {
    pageTitle: "Edit account details",
    errorMessage: getFlashMessage(req.flash(errorFlash)),
    name: req.session.user.name,
    email: req.session.user.email
  })
}

exports.postEditAccount = async (req, res, _) => {
  const { email: newEmail, name: newName } = req.body
  //* check if the email exists for more than 2 users:
  const existingUser = await User.findOne({ email: newEmail, _id: { $ne: new ObjectId(req.session.user._id) } })
  if (existingUser) {
    req.flash(errorFlash, "Email address already in use")
    return res.redirect("/auth/edit-account-details")
  }
  //* change the details of the user:
  const user = await User.findOne({ email: req.session.user.email })
  if (!user) {
    req.flash(errorFlash, "Unknown error occured")
    return res.redirect("/auth/edit-account-details")
  }
  user.name = newName
  user.email = newEmail
  const promisses = [
    user.save(),
    store.client.db().collection(SESSIONS_COLLECTION).updateMany(
      { "session.user._id": req.session.user._id },
      { $set: { "session.user.name": newName, "session.user.email": newEmail } }
    )
  ]
  await Promise.all(promisses)
  //* also change the session from the cookie, which is not updated instantly from the db:
  req.session.user.name = newName
  req.session.user.email = newEmail
  req.flash(successFlash, "Account was updated")
  res.redirect("/auth/account")
}

exports.deleteAccount = async (req, res, _) => {
  try {
    //* delete the booking from the day:
    for (const booking of req.user.bookings) {
      const day = await Day.findOne({ date: booking.date })
      if (day) {
        const promisses = []
        for (let i = booking.from; i < booking.until; i++) {
          promisses.push(day.courts[`court${booking.court}`].delete(`${i - 10}`))
        }
        await Promise.all(promisses)
        await day.save()
      }
    }
    const promisses = [
      User.deleteOne({ _id: new ObjectId(req.session.user._id) }),
      store.client.db().collection(SESSIONS_COLLECTION).deleteMany(
        { "session.user._id": req.session.user._id }
      )
    ]
    await Promise.all(promisses)
    await req.session.destroy()
  } catch (error) {
    console.log(error);
    req.flash(errorFlash, "Some error occured during the deletion process")
  }
  res.redirect("/")
}
