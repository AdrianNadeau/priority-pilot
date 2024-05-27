var express = require('express');
const axios = require('axios');

var API = express.Router();
require('dotenv').config()

////////////////// AUTHENTICATION API ////////////////////////////////
API.get('/login', (req, res) => {
     
      res.render('pages/pages-login'); 
  });
  
  API.get('/pages-login-2', function(req, res)
{
      res.render('Pages/pages-login-2');
});

API.get('/register', function(req, res)
{
      res.render('Pages/pages-register');
});
API.get('/confirm', function(req, res)
{
      res.render('Pages/pages-register-confirm');
});
API.get('/session-expired', function(req, res)
{
      res.render('Pages/pages-session-timeout');
});
API.get('/session-expired', function(req, res)
{
      res.render('Pages/pages-session-timeout');
});

// API.post('/companies', function(req, res)
// {
//       console.log("create Company!!!!")
//       res.render('Pages/pages-register');
// });
// API.get('/companies', function(req, res)
// {
//       console.log("GET ALL COMPANIES!!!!")
//       res.render('Pages/pages-register');
// });




////////////////// END AUTHENTICATION API ////////////////////////////////

////////////////// COMPANIES API ////////////////////////////////
API.get('/', function(req, res) {
      res.sendFile(path.join(__dirname, '/views/index.html'));
});
API.get('/login', function(req, res) {
     
      res.sendFile(path.join(__dirname, '/views/login.html'));
});
API.get('/register', function(req, res) {
      res.sendFile(path.join(__dirname, '/views/register.html'));
});
API.post('/register', async function(req, res) {
      // Log the body of the request
      console.log("COMPANY URL:",process.env.API_COMPANY_URL)
      console.log("api register company:", req.body);
      fetch('http://localhost:3000/companies/', {
            method: 'POST', // Specifies the request method as POST
            headers: {
            'Content-Type': 'application/json', // Sets the content type to JSON
            // You can include other headers here as needed
            },
            body: JSON.stringify({
                  company_name: req.body.companu_name,
                  company_headline: req.body.companu_name,
                  company_description: req.body.company_description,
                  company_logo: req.body.company_logo
            }),
            })
            .then(response => response.json()) // Parse the JSON response
            .then(data => {
                  console.log('Success:', data); // Handle the response data
            })
            .catch(error => {
                  console.error('Error:', error); // Handle any errors
      });
});
//       try {
//             const response = await axios.post('http://localhost:3000/companies/', {
//             company_name: req.body.companu_name,
//             company_headline: req.body.companu_name,
//             company_description: req.body.company_description,
//             company_logo: req.body.company_logo

//          });
//         res.send(response.data); // Send only the data part of the response
//     } catch (error) {
//          console.error('Error fetching data from API:', error);
//          res.status(500).send(error.message); // Send a 500 status with the error message
//     }

// API.post('/register', async function(req, res)
// {
    
//     // Log the body of the request
//     console.log("register company:",req.body)


// });
API.get('/companies', function(req, res)
{
      console.log('req',req)
      res.send("GET ALL COMPANIES!!!!")
      
});
// API.get('/pages-coming-soon', function(req, res)
// {
//       res.render('Pages/pages-coming-soon');
// });
// API.get('/pages-lock-screen', function(req, res)
// {
//       res.render('Pages/pages-lock-screen');
// });
// API.get('/pages-lock-screen-2', function(req, res)
// {
//       res.render('Pages/pages-lock-screen-2');
// });
// API.get('/pages-maintenance', function(req, res)
// {
//       res.render('Pages/pages-maintenance');
// });
// API.get('/pages-recoverpw', function(req, res)
// {
//       res.render('Pages/pages-recoverpw');
// });
// API.get('/pages-recoverpw-2', function(req, res)
// {
//       res.render('Pages/pages-recoverpw-2');
// });
// API.get("/about", function (req, res) {
//       res.send("About this wiki");
//     });
   
// API.get('/pages-coming-soon', function(req, res)
// {
//       res.render('Pages/pages-comingsoon');
// });
// API.get('/logout', function(req, res) {
//       try {
//           fetch(process.env.SERVER_HOST + "/logout")
//               .then(response => {
//                   if (!response.ok) {
//                       throw new Error('Network response was not ok');
//                   } else {
//                       // destroy session
//                       res.redirect('/register');
//                   }
//               })
//               .catch(error => {
//                   console.error('Error sending data:', error);
//                   res.status(500).json({ error: error.message });
//               });
//       } catch (error) {
//           console.error('Error:', error);
//           res.status(500).json({ error: error.message });
//       }
//   });


module.exports = API;