var app = require('express')();
var express = require('express');
var session = require('express-session')
var path = require('path');
var http = require('http').Server(app);
var bCrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const uuid = require('uuid');



// var Authrouter = require('./routes/AuthRouter.js');
// var DashboardRouter = require('./routes/DashboardRouter.js');

// Access public folder from root
// app.use('/public', express.static('public'));
// app.get('/layouts/', function(req, res) {
//   res.render('view');
// });
app.get('', (req, res) => {
  res.json({ message: 'Priority Pilot API is healthy...' });
});
// Parse JSON bodies for application/json content type
app.use(bodyParser.json());

// Parse URL-encoded bodies for application/x-www-form-urlencoded content type
app.use(bodyParser.urlencoded({ extended: true }));

const sessionMiddleware = session({

  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: true,
  rolling: true // Force regeneration of session ID for each request
});
app.use(sessionMiddleware);


// Add Authentication Route file with app
// app.use('/', Authrouter); 
// app.use('/control', DashboardRouter);


//For set layouts of html view
// var expressLayouts = require('express-ejs-layouts');
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
// app.use(expressLayouts);

// Add Route file with app
let port = process.env.PORT;

const db = require("./models/server.js");
db.sequelize.sync()
  .then(() => {
    console.log("DB Connected...");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

  
require("./routes/company.routes.js")(app);
require("./routes/person.routes.js")(app);
require("./routes/change_log.routes.js")(app);
require("./routes/project.routes.js")(app);
require("./routes/change_log_details.routes.js")(app);
require("./routes/phase.routes.js")(app);
require("./routes/priority.routes.js")(app);
require("./routes/tag.routes.js")(app);
require("./routes/status.routes.js")(app);
require("./routes/phase.routes.js")(app);
require("./routes/priority.routes.js")(app);

http.listen(port, function(){
  console.log('API listening on *:',port);
});
