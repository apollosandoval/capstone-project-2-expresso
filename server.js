// import common libraries
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');
const morgan = require('morgan');
// create and export your express app
const express = require('express');
const app = express();
// import the api router
const apiRouter = require('./api/api');
// set variable for port that server will be listening on
const PORT = process.env.PORT || 4000;
// activate imported middleware
app.use(bodyParser.json());
app.use(cors());
app.use(errorHandler());
app.use(morgan('dev'));
// mount apiRouter at all routes starting at '/api'
app.use('/api', apiRouter);

// start server listening on PORT
app.listen(PORT, (err) => {
  if (err) {
    return console.log('Server did not start succesfully: ', err);
  }
  console.log(`Server is listening on ${PORT}`);
});
// export app
module.exports = app;
