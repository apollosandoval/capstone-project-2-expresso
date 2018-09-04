/*
Since all routes in this project have paths starting at the /api subpath, we will create an API router that will prepend this path segment.
*/
const express = require('express');
// import the employees router
const employeesRouter = require('./employees');
// import the menu router
const menusRouter = require('./menus');
// create an instance of an express router which will handle all calls to '/api' route path
const apiRouter = express.Router();

// mount the employees router at '/employees', use the instance of the express router to mount
apiRouter.use('/employees', employeesRouter);
// mount the menus router at '/menus'
apiRouter.use('/menus', menusRouter);


// export the router
module.exports = apiRouter;
