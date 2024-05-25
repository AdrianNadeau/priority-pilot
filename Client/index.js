const express = require('express');
const app = express();
require('dotenv').config()
var API = require('./api');

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the "public" directory
app.use(express.static('public'));
app.use('/', API); 
// Define a route


console.log("PORT:",process.env.PORT)
// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
