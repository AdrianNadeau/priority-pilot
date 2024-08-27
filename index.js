var app = require('express')();
var express = require('express');
var session = require('express-session')
var path = require('path');
var http = require('http').Server(app);
var bCrypt = require('bcryptjs');
const multer = require('multer');

var router = require('./router.js');
var Authrouter = require('./routes/AuthRouter.js');
var DashboardRouter = require('./routes/DashboardRouter.js');

require('dotenv').config()

const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');

app.use(express.urlencoded({ extended: true }));

// Access public folder from root
app.use('/public', express.static('public'));
app.get('/layouts/', function(req, res) {
  res.render('view');
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Redis client
let redisClient = createClient();
redisClient.connect().catch(console.error);

// Initialize RedisStore
let redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:",
});
const sessionMiddleware = session({
  store: redisStore,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using https
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
});
app.use(sessionMiddleware);



// Add Authentication Route file with app
app.use('/', Authrouter); 
app.use('/control', DashboardRouter);


//For set layouts of html view
var expressLayouts = require('express-ejs-layouts');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

// Add Route file with app
app.use('/', router); 

const db = require("./models");
db.sequelize.sync()
  .then(() => {
    console.log("DB Connected...");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err);
  });

// app.use('/logo/upload', express.static(path.join(__dirname, '/upload/logos')));
// app.use('/avatar/upload', express.static(path.join(__dirname, '/upload/avatars')));

require("./routes/company.routes")(app);
require("./routes/person.routes")(app);
require("./routes/change_log.routes")(app);
require("./routes/project.routes")(app);
require("./routes/change_log_details.routes")(app);
require("./routes/phase.routes")(app);
require("./routes/priority.routes")(app);
require("./routes/tag.routes")(app);
require("./routes/status.routes")(app);
require("./routes/phase.routes")(app);
require("./routes/priority.routes")(app);
// require("./routes/files.routes.js")(app);

http.listen(8080, function(){
  console.log('listening on *:8080');
});
