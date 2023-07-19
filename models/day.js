const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const daySchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  courts: {
    court1: {
      type: Map,
      of: {
        type: Schema.Types.ObjectId,
        ref: "User",
      }
    },
    court2: {
      type: Map,
      of: {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    },
    court3: {
      type: Map,
      of: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    }
  }
})

module.exports = mongoose.model('Day', daySchema);
