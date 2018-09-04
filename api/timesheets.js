const express = require('express');
// create an instance of an express router which handles calls to '/api/employees/:employeeId/timesheets'
const timesheetsRouter = express.Router({mergeParams: true});
// import sqlite3
const sqlite3 = require('sqlite3');
// create a database instance andn set a backup default
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: timesheetId};
  db.get(sql, values, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      req.timesheet = timesheet;
      next()
    } else {
      res.sendStatus(404);
    }
  });
});

// creates a 'get' route that returns all timesheets related to a specific employee ID
timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const values = {$employeeId: req.params.employeeId};

  db.all(sql, values, (err,timesheets) => {
    if(err) {
      next(err);
    }
    else {
      res.status(200).json({timesheets: timesheets});}
  });
}); // end of get route

// creates a 'post' route that creates a new timesheet related to the specified employee Id
timesheetsRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;
  const employeeId = req.params.employeeId;

  // retrieve the timesheet data with the provided id if it exists, and if not return a 400 error
   db.get('SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId', {$employeeId: employeeId}, (err, employee) => {
    if (err) {
      next(err)
    } else {
      if (!hours || !rate || !date || !employeeId) {
        return res.sendStatus(400);
      }
      // use the retrieved employee info to add the timesheet to the Timesheet table
      const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employeeId)';
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId
      };
      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`, (error, timesheet) => {
            res.status(201).json({timesheet: timesheet});
          }); // end of db.get
        }
      }) // end of db.run
    } // end of 'else' statement
  }); // end of db.get
}); // end of post route

// update the timesheet with the specified timesheet ID using the info from the timesheet property of the req body
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours;
  const rate = req.body.timesheet.rate;
  const date = req.body.timesheet.date;
  const employeeId = req.params.employeeId;
  const employeeSql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const employeeValues = {$employeeId: employeeId}
  db.get(employeeSql, employeeValues, (error, timesheet) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !date || !employeeId) {
        return res.sendStatus(400);
      }

      const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, date = $date, employee_id = $employeeId WHERE Timesheet.id = $timesheetId';
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId,
        $timesheetId: req.params.timesheetId
      };
      db.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          // return the updated timesheet
          db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`, (error, timesheet) => {
            res.status(200).json({timesheet: timesheet});
          });
        }
      }); // end of db.run
    } // end of else statement
  }); // end of db.get route
}); // end of put route

// delete the timesheet with the specified timesheet ID
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: req.params.timesheetId};

  db.run(sql, values, (err) => {
    if  (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  }); // end of db.run
}); // end of delete route

// export the timesheets router
module.exports = timesheetsRouter;
