const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { MONGODB_URI, SESSIONS_COLLECTION } = require("./constants")

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: SESSIONS_COLLECTION
});

module.exports = store
