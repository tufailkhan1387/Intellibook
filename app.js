require("dotenv").config();
const express = require("express");
const app = express();
const db = require("./models");
const bodyParser = require("body-parser");
const cors = require("cors");
const error = require("./middlewares/error");

const userSite = require("./routes/user");
const path = require('path');

app.use(cors());


app.use(express.json());

//for form data and multipart data
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/user", userSite);

// Error middleware : To show any error if promise fails
app.use(error);

// ✅ Fix static files to allow CORS
app.use("/public", express.static("./public", {
  setHeaders: function (res, path, stat) {
    res.set('Access-Control-Allow-Origin', '*'); // or specific domain like 'http://localhost:5173'
  }
}));

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initializing Server along with creating all the tables that exist in the models folder
db.sequelize.sync().then(() => {
  app.listen(8000, () => {
    console.log(`Starting the server at port ${process.env.PORT} ...`);
  });
});
