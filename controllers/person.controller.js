const session = require("express-session");
const db = require("../models");
const Person = db.persons;
const Company = db.companies;
const Op = db.Sequelize.Op;
// const bcrypt = require('bcrypt');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const verifyToken = require("../routes/JWTRouter");


// Create and Save a new 
exports.create = async (req, res) => {
  const session = req.session;
  const company_id_fk = session.company.id;

  try {
    // Hash the password
    const { email, first_name, last_name, initials, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    

    if (!email) {
      return res.status(400).json({ message: "Email cannot be empty!" });
    }
    console.log("EMAIL:", email);
    // Check if user email already exists
    const person = await Person.findOne({
      where: {
        email: email
      }
    });

    if (person) {
      console.log("User with this email already exists");
      return res.status(500).json({ message: "User with this email already exists" });
    } else {
     
      // Generate a salt
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Error generating salt" });
        }
  
        // Hash the password using the generated salt
        bcrypt.hash(password, salt, async (err, hash) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error hashing password" });
          }
  
          try {
            // Create the person
            
            const newPerson = await Person.create({
              email,
              first_name,
              last_name,
              initials,
              password: hashedPassword,
              company_id_fk,
              role,
              isAdmin:true,
            });
  
            if (req.body.register_yn && req.body.register_yn === "y") {
              // If registered, redirect to the control page
              return res.redirect("/");
            } else {
              // Otherwise, redirect to persons page
              return res.redirect("/persons");
            }
          } catch (error) {
            console.error("Error creating person:", error);
            return res.status(500).json({ message: "Internal Server Error" });
          }
        });
      });
    }
    
    console.log("PERSON:",person);
    
  } catch (error) {
    console.error("Error creating person:", error);
    return res.status(500).json({ message: "Error creating person " });
  }
};

exports.findAll = (req, res) => {
  console.log("Get all users for company");
  let company_id_fk;
  try{
    
    if(!req.session){
      res.redirect("/pages-500");
    }
    else{
      company_id_fk = req.session.company.id;
    }
  }catch(error){
    console.log("error:",error);
  }
  console.log("company_id_fk:",company_id_fk);
  Person.findAll({ where: { company_id_fk: company_id_fk } })
    .then(data => {
      console.log("data:",data);
      res.render("Pages/pages-persons", {
        persons: data
      });
    })
    .catch(err => {
      res.status(500).send({
        message:
              err.message || "Some error occurred while retrieving people."
      });
    });
};
  
// login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const person = await Person.findOne({ where: { email } });
    if (!person) {
      return res.status(404).json({ message: "User not found." });
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password.trim(), person.password.trim());
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    console.log(`Company login ID: ${person.company_id_fk}`);

    // Find the associated company
    const company = await Company.findOne({ where: { id: person.company_id_fk } });
    if (!company) {
      return res.redirect("/login");
    }

    // Check if session values are present
    if (req.session.company || req.session.person) {
      console.log("Destroying existing session...");

      req.session.destroy(async err => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).send('Internal Server Error');
        }

        // Create a new session
        req.session.regenerate(async err => {
          if (err) {
            console.error('Error regenerating session:', err);
            return res.status(500).send('Internal Server Error');
          }

          // Set new session values
          req.session.company = company;
          req.session.person = person;
          console.log("Redirecting to Dashboard...");
          res.redirect("/");
        });
      });
    } else {
      // No existing session; set new session values directly
      req.session.company = company;
      req.session.person = person;
      console.log("Redirecting to Dashboard with new session...");
      res.redirect("/");
    }

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({
      message: err.message || "Some error occurred while logging in."
    });
  }
};
// Find a single  with an id
exports.findOne = (req, res) => {
  id = req.params.id;
  Person.findByPk(id)
    .then(data => {
      if (data) {
        // res.send(data);
        res.redirect("/persons/edit/"+id);
      } else {
        res.status(404).send({
          message: `Cannot find Person with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Person with id=" + id
      });
    });
};
exports.findOneForEdit = (req, res) => {
    
  id = req.params.id;
   
  Person.findByPk(id)
    .then(data => {
      if (data) {
        
        res.render("Pages/pages-edit-person", {
          personData: data,
        });
      } else {
        res.status(404).send({
          message: `Cannot find Person with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Person with id=" + id
      });
    });
};
exports.findAllByCompanyId = (req, res) => {
    
  id = req.params.id;
  Person.find([id])
    .then(data => {
      if (data) {
        // res.send(data);
        // res.redirect('/persons/pages-edit-person/'+id);
        // Render the page when all data retrieval operations are complete
        res.render("Pages/pages-edit-person", {
          personData: data,
        });
      } else {
        res.status(404).send({
          message: `Cannot find Person with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Person with id=" + id
      });
    });
};
// Update a  by the id in the request
exports.update = (req, res) => {
 
  const id = req.body.person_id;
    
  Person.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.redirect("/persons/");
        // res.send({
        //   message: "Person was updated successfully."
        // });
      } else {
        res.send({
          message: `Cannot update Person with id=${id}. Maybe Person was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating  with id=" + id
      });
    });
};

// Delete a  with the specified id in the request
exports.delete = (req, res) => {
  
  const id = req.params.id;

  
  Person.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Person was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Person with id=${id}. Maybe Person was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Person with id=" + id
      });
    });
};

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  Person.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Companies were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
            err.message || "Some error occurred while removing all companies."
      });
    });
};
