require('dotenv').config();
const path = require("path")
const express = require("express")
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require("connect-flash")

const errorCoontroller = require("./controllers/error")
const authRoutes = require("./routes/auth")
const homeRoutes = require("./routes/home")
const User = require("./models/user")
const constants = require("./utils/constants")
const store = require("./utils/MongoDbStore")

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use((_, res, next) => {
  res.locals.host = constants.HOST
  next()
})
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store
  })
)

app.use(flash()) //* this has to also be initiated after the session

app.use((req, _, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn
  next()
})

app.use(homeRoutes)
app.use("/auth", authRoutes)
app.use(errorCoontroller.get404)

mongoose.connect(constants.MONGODB_URI)
  .then(() => {
    console.log("App listening to port " + constants.PORT);
    app.listen(constants.PORT)
  })
  .catch(err => {
    console.log("Error in connecting to mongoose", err)
  });