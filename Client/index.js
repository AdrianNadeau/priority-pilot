const express = require('express');
const app = express();
require('dotenv').config()
var cors = require('cors')
var path = require('path');

var API = require('./api');

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies (optional, but useful if you plan to handle JSON data)
// Serve static files from the "public" directory

app.use(express.static('public'));
app.use('/', API); 
app.use(cors())

app.get('/config', (req, res) => {
    res.json({
      companyURL: process.env.API_COMPANY_URL,
      
    });
  });

console.log("PORT:",process.env.PORT)
// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
