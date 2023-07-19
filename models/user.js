const mongoose = require('mongoose');
const Day = require("./day")

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  passwordChangeUuid: String,
  emailActivationUuid: String,
  bookings: [
    {
      date: {
        type: Date,
        required: true
      },
      from: {
        type: Number,
        required: true
      },
      until: {
        type: Number,
        required: true
      },
      court: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ]
})

userSchema.methods.addBooking = function (date, from, until, court) {
  const price = (until - from) * 10
  this.bookings.push({
    date, from, until, court, price
  })
  return this.save()
}

userSchema.methods.deleteBooking = function (id) {
  this.bookings.pull({ _id: id })
  return this.save()
}

module.exports = mongoose.model('User', userSchema);
