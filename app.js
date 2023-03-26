const express = require('express');
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// localhost:4000/api/v1/users
app.use('/api/v1/users', usersRouter);

module.exports = app;
