require('dotenv').config();

//* if we have the port in env variables it means it is on the Google cloud
if (process.env.PORT) {
  exports.PORT = process.env.PORT
  exports.HOST = "https://renting-platform-392612.ew.r.appspot.com"
} else {
  exports.PORT = 3000
  exports.HOST = "http://localhost:3000"
}

exports.MONGODB_URI =
  `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@cluster0.rxv84.mongodb.net/sports-booking?retryWrites=true&w=majority`
exports.SESSIONS_COLLECTION = "sessions"

exports.errorFlash = "error"
exports.successFlash = "success"
