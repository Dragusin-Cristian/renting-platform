const bcrypt = require("bcryptjs")
const { v4: uuid4 } = require("uuid")
const { ObjectId } = require("mongodb");
const User = require('../models/user');
const getFlashMessage = require("../utils/getErrorFlash")
const sendResetPassMail = require("../utils/sendResetPassMail");
const store = require("../utils/MongoDbStore")
const { SESSIONS_COLLECTION } = require("../utils/constants")

exports.getLogin = (req, res, _) => {
  res.render('auth/login', {
    pageTitle: 'Login',
    errorMessage: getFlashMessage(req.flash("error"))
  });
};

exports.postLogin = async (req, res, _) => {
  const { email, password } = req.body
  const user = await User.findOne({ email: email })
  if (!user) {
    req.flash("error", "Invalid email")
    return res.redirect("/auth/login")
  }
  const doMatch = await bcrypt.compare(password, user.password)
  if (doMatch) {
    req.session.isLoggedIn = true;
    req.session.user = user;
    return req.session.save(err => {
      err && console.log(err);
      return res.redirect('/');
    });
  }
  req.flash("error", "Invalid password")
  res.redirect("/auth/login")
};



exports.getSignup = (req, res, _) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: getFlashMessage(req.flash("error"))
  });
};

exports.postSignup = async (req, res, _) => {
  if (req.body.password !== req.body.confirmPassword) {
    req.flash("error", "Passwords do not match")
    return res.redirect("/auth/signup")
  }
  const existingUser = await User.findOne({ email: req.body.email })
  if (existingUser) {
    req.flash("error", "User already exists")
    return res.redirect("/auth/signup")
  }
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 12)
    const user = new User({
      email: req.body.email,
      password: hashedPassword,
      name: req.body.name
    })
    await user.save()
  } catch (_) {
    req.flash("error", "An error occured in the user creating process")
  }
  res.redirect("/auth/login")
};

exports.postLogout = (req, res, _) => {
  req.session.destroy(err => {
    if (err) {
      req.flash("error", "Could not log you out")
      console.log(err)
    }
    res.redirect('/');
  })
};

exports.getEmailResetPassword = (req, res, _) => {
  res.render("auth/emailResetPass", {
    path: "/reset",
    pageTitle: "Request Reset Password",
    errorMessage: getFlashMessage(req.flash("error"))
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
      req.flash("error", "An error occured when trying to send the email. You may try again.")
      return res.redirect("/auth/email-reset-pass")
    }
  } else {
    req.flash("error", "No account was found for this email adddress.")
    return res.redirect("/auth/email-reset-pass")
  }

  res.redirect("/auth/email-sent")
}

exports.getEmailSent = (req, res, _) => {
  res.render("auth/emailSent", {
    pageTitle: "Email sent",
    errorMessage: getFlashMessage(req.flash("error"))
  })
}

exports.getResetPassword = (req, res, _) => {
  res.render("auth/resetPassFormPage", {
    pageTitle: "Reset password",
    uuid: req.params.uuid,
    errorMessage: getFlashMessage(req.flash("error"))
  })

}

exports.postResetPassword = async (req, res, _) => {
  if (req.body.password !== req.body.confirmPassword) {
    req.flash("error", "Passwords do not match")
    return res.redirect("/auth/reset-pass/:" + req.body.uuid)
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
    return res.redirect("/auth/password-changed")
  }
  req.flash("error", "There is no user that requested a password change with this unique key.")
  res.redirect("/auth/reset-pass/" + req.body.uuid)
}

exports.getPasswordChanged = (req, res, _) => {
  res.render("auth/passwordChanged", {
    pageTitle: "Password changed",
    errorMessage: getFlashMessage(req.flash("error"))
  })
}

exports.getAccountPage = (req, res, _) => {
  res.render("auth/account", {
    pageTitle: "Account page",
    errorMessage: getFlashMessage(req.flash("error")),
    successMessage: getFlashMessage(req.flash("success")),
    username: req.session.user.name,
    email: req.session.user.email
  })
}

exports.getEditAccount = (req, res, _) => {
  res.render("auth/editAccount", {
    pageTitle: "Edit account details",
    errorMessage: getFlashMessage(req.flash("error")),
    name: req.session.user.name,
    email: req.session.user.email
  })
}

exports.postEditAccount = async (req, res, _) => {
  const { email: newEmail, name: newName } = req.body
  //* check if the email exists for more than 2 users:
  const existingUser = await User.findOne({ email: newEmail, _id: { $ne: new ObjectId(req.session.user._id) } })
  if (existingUser) {
    req.flash("error", "Email address already in use")
    return res.redirect("/auth/edit-account-details")
  }
  //* change the details of the user:
  const user = await User.findOne({ email: req.session.user.email })
  if (!user) {
    req.flash("error", "Unknown error occured")
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
  req.flash("success", "Account was updated")
  res.redirect("/auth/account")
}

exports.deleteAccount = async (req, res, _) => {
  //! finish the delete Account
  //! protect the routes
  //! add signup email verification
  // -- push to the auth branch
  //! add basic css for the all application
  // -- push to the auth branch 
  // -- merge in master 
  //! work on the actual logic
  try {
    const promisses = [
      User.deleteOne({ _id: new ObjectId(req.session.user._id) }),
      store.client.db().collection(SESSIONS_COLLECTION).deleteMany(
        { "session.user._id": req.session.user._id }
      )
    ]
    await Promise.all(promisses)

    req.flash("success", "Account deleted")
  } catch (error) {
    console.log(error);
    req.flash("error", "Some error occured during the deletion process")
  }
  res.redirect("/")
}
