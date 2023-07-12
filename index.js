require('dotenv').config();
const path = require("path")
const express = require("express")

const app = express()

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use((_1, res, _2) => {
  res.render("index")
})

const PORT = process.env.PORT || 3000

app.listen(PORT)