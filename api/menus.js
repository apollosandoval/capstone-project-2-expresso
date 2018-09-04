const express = require('express');
const menusRouter = express.Router();
// const menuItemsRouter = require('./menuItems');
// menusRouter.use('/:menuId/menu-items', menuItemsRouter);

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// add a router parameter of menuId to the router to retrieve a menu with a particular id
menusRouter.param('menuId', (req, res, next, menuId) => {
  db.get('SELECT * FROM Menu WHERE Menu.id = $menuId', {$menuId: menuId}, (err, menu) => {
    if (err) {
      next(err);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  }); // end of db.get
}); // end of param route

// Add a get handler to retrieve all existing menus on the menus property of the response body
menusRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Menu', (err, menus) => {
    if(err) {
      next(err);
    } else {
      res.status(200).json({menus: menus});
    }
  });
}); // end of get route

// add a get handler for "/:menuId"
menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
}); // end of get route

// Add a post handler to create a new menu item with the info from the menu prop of the request body
menusRouter.post('/', (req, res, next) => {
  // verify that all required fields are present on the menus object
  const title = req.body.menu.title;
  if (!title) {
    return res.sendStatus(400);
  };
  // execute an SQL query to create a new menu with the supplied attributes
  const sql ='INSERT INTO Menu (title) VALUES ($title)';
  const values = {$title: title};
  db.run(sql, values, function(err) {
    if (err) {
      next(err);
    } else {
      // retrieve the newly created menu and send it in the response body
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`, (err, menu) => {
        res.status(201).json({menu: menu})
      })
    }
  }); // end of db.run
}); // end of post route

// create a route handler to update menu information
menusRouter.put('/:menuId', (req, res, next) => {
  const title = req.body.menu.title;
  if(!title) {
    return res.sendStatus(400);
  }
  const sql = 'UPDATE Menu SET title = $title WHERE Menu.id = $menuId';
  const values = {
    $title: title,
    $menuId: req.params.menuId
  };
  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`, (err, menu) => {
        res.status(200).json({menu: menu});
      });
    }
  }); // end of db.run
}); // end of 'put' route

// create a route handler to delete menus at the given menu id
menusRouter.delete('/:menuId', (req, res, next) => {
  // run a check on the specified menu to see if it contains any related menu items
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const values = {$menuId: req.params.menuId};
  db.get(sql, values, (err, items) => {
    if (err) {
      next(err);
    } else if (items) {
      res.sendStatus(400); // if menu contains any related items send status 400
    } else {
      // if db.get returns an empty response object then we can delete the menu
      db.run('DELETE FROM Menu WHERE Menu.id = $menuId', values, function(err) {
        if(err) {
          next(err);
        } else {
          res.sendStatus(204);
        }
      }); // end of db.run
    } // end of else statement
  }); // end of db.get
}); // end of delete route

module.exports = menusRouter;
