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
// API.post('/register', async function(req, res)
// {
//       console.log("Post register")
//       //call register backend api 
//       process.env.API_COMPANY_URL
//       try {
//             const response = await axios.get('http://localhost:3000/companies');
//             console.log(response.data);
//       } catch (error) {
//             console.error('Error fetching data from API:', error);
//       }
//       try {
            
//             // Example API call to an external API
//             console.log("COMPANY_API:",process.env.API_COMPANY_URL)
//             res.json({ message: 'Hello from API' });
//             // axios.post(process.env.API_COMPANY_URL, {
//             //       company_name: 'Company1',
//             //       company_headline:'Desc'
                  
//             //     })
//             //     .then(function (response) {
//             //       console.log(response);
//             //       res.send(response);
//             //     })
//             //     .catch(function (error) {
//             //       console.log(error);
//             //       res.send(error);
//             //     });
//             // Render the index.ejs template with data from the API
//             // res.render('index', { data });
//         } catch (error) {
//             console.error('Error fetching data from API:', error);
//             // res.render('pages/pages-login'); 
//         }
// });
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