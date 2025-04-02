const db = require("../models");
const changed_password_token = db.changed_password_token;
const Op = db.Sequelize.Op;

// Create and Save a new ChangeReason
exports.create = async (req, res) => {
  const { email } = req.body;
  const company_id_fk = req.session.company?.id;
  console.log("company_id_fk", company_id_fk);
  const person_id_fk = req.session.person?.id;
  console.log("person_id_fk", person_id_fk);

  const company = await Company.findByPk(company_id_fk);
  if (!company) {
    const error = new Error("Company not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!email || !password) {
    const error = new Error("Email and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const existingPerson = await Person.findOne({ where: { email } });
  if (existingPerson) {
    const error = new Error("User with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  // Save ChangeReason in the database
  ChangeReason.create(phase)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the ChangeReason.",
      });
    });
};

// Retrieve all ChangeReasons from the database.
exports.findAll = (req, res) => {
  ChangeReason.findAll({})
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving phases.",
      });
    });
};

// Find a single ChangeReason with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  ChangeReason.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find ChangeReason with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving ChangeReason with id=" + id,
      });
    });
};

// Update a ChangeReason by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  ChangeReason.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "ChangeReason was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update ChangeReason with id=${id}. Maybe ChangeReason was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating ChangeReason with id=" + id,
      });
    });
};

// Delete a ChangeReason with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  ChangeReason.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "ChangeReason was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete ChangeReason with id=${id}. Maybe ChangeReason was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete ChangeReason with id=" + id,
      });
    });
};

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  ChangeReason.destroy({
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
