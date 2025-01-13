const { where } = require("sequelize");
const db = require("../models");
const Company = db.companies;
const Person = db.persons;
const Tag = db.tags;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  const portfolio_budget = req.body.portfolio_budget;
  const effort = req.body.effort;

  try {
    const {
      company_name,
      company_headline,
      company_description,
      company_logo,
      portfolio_budget,
      effort,
    } = req.body;
    if (!company_name) {
      return res.status(400).json({ message: "Company Name cannot be empty!" });
    }

    const company = await Company.create({
      company_name,
      company_headline,
      company_description,
      company_logo,
      portfolio_budget,
      effort,
    });
    if (company) {
      const session = req.session;
      session.company = company;
      try {
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
exports.findDefaults = (req, res) => {
  try {
    if (!req.session) {
      return res.redirect("/pages-500");
    } else {
      company_id_fk = req.session.company.id;
    }
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({ message: "Error retrieving session data." });
  }

  Company.findOne({ where: { id: company_id_fk } })
    .then((company) => {
      if (!company) {
        return res.status(404).send("Company not found");
      }
      // Handle the result
      //get all tags
      Tag.findAll({
        where: {
          [Op.or]: [{ company_id_fk: company_id_fk }, { company_id_fk: 0 }],
        },
        order: [["tag_name", "ASC"]],
      })
        .then((tags) => {
          if (!tags) {
            // return res.status(404).send("Tag not found");
          }
          res.render("Pages/pages-defaults", { company, tags });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send("Internal Server Error");
        });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
};
exports.setDefaults = async (req, res, next) => {
  console.log("************ SET DEFAULTS ************");

  // Ensure session exists and extract company ID
  let company_id_fk;
  try {
    if (!req.session || !req.session.company) {
      return res.redirect("/pages-500");
    }
    company_id_fk = req.session.company.id;
  } catch (error) {
    console.error("Error retrieving session data:", error);
    return res.status(500).json({ message: "Error retrieving session data." });
  }

  // Update company portfolio budget and effort
  try {
    const [rowsUpdated, [updatedCompany]] = await Company.update(
      {
        portfolio_budget: req.body.portfolio_budget,
        effort: req.body.portfolio_effort,
      },
      {
        returning: true,
        where: { id: company_id_fk }, // Use the correct company ID
      },
    );

    if (rowsUpdated === 0) {
      return res
        .status(404)
        .json({ message: "Company not found or no updates were made." });
    }

    // /companies/set/defaults
    res.redirect("/companies/get/defaults");
    // res.json(updatedCompany);
  } catch (error) {
    console.error("Error updating company data:", error);
    next(error); // Pass the error to the Express error handler
  }
};
