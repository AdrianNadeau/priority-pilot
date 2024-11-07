const db = require("../models");
const Company = db.companies;
const Person = db.persons;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  try {
    const {
      company_name,
      company_headline,
      company_description,
      company_logo,
    } = req.body;
    if (!company_name) {
      return res.status(400).json({ message: "Company Name cannot be empty!" });
    }

    const company = await Company.create({
      company_name,
      company_headline,
      company_description,
      company_logo,
    });

    if (company) {
      const session = req.session;
      session.company = company;
      try {
        console.log("create session.company:", session.company.id);
        res.redirect("/confirm");
      } catch (err) {
        console.log("err:", err);
      }
    }
  } catch (error) {
    console.error("Error creating company:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// exports.create = (req, res) => {
//   console.log("in controller")
//   if (!req.body.company_name) {
//     return res.status(400).send({
//       message: "Company Name cannot be empty!"
//     });
//   }
//   console.log("create backend");
//   // Access the data from the request body
//   const { company_name, company_description, company_headline, company_logo } = req.body;

//   // Create a Company object
//   const company = {
//     company_name: company_name,
//     company_description: company_description,
//     company_headline: company_headline,
//     company_logo: company_logo
//   };

//   Company.create(company)
//     .then(data => {
//       if (!data || !data.id) {
//         res.send("Company data or ID is missing after creation");

//       }
//       else{

//       }
//     })
//     .catch(err => {
//       console.log("Error Object is here")
//       console.log(err)
//       res.status(500).send({
//         message: err.message || "Some error occurred while creating the Company."

//       });
//     });

// };

// Retrieve all  from the database.
exports.findAll = (req, res) => {
  Company.findAll({})
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving companies.",
      });
    });
};

// Find a single Company with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Company.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Company with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Company with id=" + id,
      });
    });
};

// Update a Company by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Company.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Company was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Company with id=${id}. Maybe Company was not found or req.body is empty or violates foreign key contstraint!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Company with id=" + id,
      });
    });
};

// Delete a Company with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Company.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Company was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Company with id=${id}. Maybe Company was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Company with id=" + id,
      });
    });
};

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  Company.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({ message: `${nums} Companies were deleted successfully!` });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all companies.",
      });
    });
};
