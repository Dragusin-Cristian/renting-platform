const getErrorFlash = require("../utils/getErrorFlash")

exports.getHome = (req, res, _) => {
  res.render("home/index.ejs", {
    pageTitle: 'Login',
    errorMessage: getErrorFlash(req.flash("error"))
  })
} 