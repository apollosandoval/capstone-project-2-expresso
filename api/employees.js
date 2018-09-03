const express = require('express');
//import the timesheets router
const timesheetsRouter = require('./timesheets');
// create an instance of an express router which handles calls to '/api/employees'
const employeesRouter = express.Router();
// mount the timesheets router
employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);
//create an instance of sqlite3
const sqlite3 = require('sqlite3');
// create an instance of database.sqlite and check if the test database has been set
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// add a router.param (Expressjs docs) of employeeId to the router to check that an employee with that Id exists
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  db.get('SELECT * FROM Employee WHERE Employee.id = $employeeId', {$employeeId: employeeId}, (err, employee) => {
    if (err) {
      next(err);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
}); // end of param route

// add a route path to '/api/employees' using the router to handle GET requests
employeesRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.is_current_employee = 1';

  db.all(sql, (err, employees) => {
    if (err) {
      next(err); // if an error occurs, escapes GET route and moves to next call
    } else {
      res.status(200).json({employees: employees});
    }
  }); // end of db.all
}); // end of 'get' route

// router.param has already taken care of all necessary SQL and error handling so we only need to return the response object
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
})

// create a route handler to create a new employee and insert it into Employee table
employeesRouter.post('/', (req, res, next) => {
  // first verify that all required fields are present on the employee object
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;
  const isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1; // check if variable is set, otherwise set value to 1

  if (!name || !position || !wage) {
    return res.sendStatus(400); // returns a 400 'Bad Request' response if any required fields are missing
  }
  // execute an SQL query to create a new artist with the supplied attributes
  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $isCurrentEmployee)';
  const values = {$name: name,
                  $position: position,
                  $wage: wage,
                  $isCurrentEmployee: isCurrentEmployee};
  db.run(sql, values, function(err) { // <-- Why was arrow syntax giving me an error here?
    if (err) {
      next(err);
    } else {
      // retrieve the newly created employee and send it in the response body
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`, (err, employee) => {
        res.status(201).json({employee: employee});
      });
    }
  });
}); // end of 'post' route

// create a route handler to update the employee info at the specified employee id
employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name;
  const position = req.body.employee.position;
  const wage = req.body.employee.wage;
  const isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  // verify no required fields are missing
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  };
  //execute an SQL statement to update the artist with the supplied info
  const sql = 'UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee,
    $employeeId: req.params.employeeId
  };
  db.run(sql, values, (err) => {
    if(err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (err, employee) => {
        res.status(200).json({employee: employee});
      });
    }
  });
}); // end of 'put' route

// create a route handler to update the specified employee to have an is_current_employee parameter of 0
employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId';
  const values = {$employeeId: req.params.employeeId};
  // execute an SQL query to update the supplied parameter
  db.run(sql, values, (err) => {
    if (err) {
      next(err)
    } else {
      // retrieve the newly updated artist and send it in the response
      db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`, (err, employee) => {
        res.status(200).json({employee: employee});
      });
    }
  });
}); // end of 'delete' route

// export our employees router for use in api.js
module.exports = employeesRouter;
