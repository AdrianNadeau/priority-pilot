const session = require("express-session");
const db = require("../models");
const ChangedPasswordToken = db.changed_password_token;

const Op = db.Sequelize.Op;

// Create and Save a new
exports.create = async (req, res) => {
  console.log("CREATE CHANGED PASSWORD TOKEN", req.body);
  person = req.session.person;
  console.log("SESSION PERSON", person);
  // Create a Token Record
  const newChangedToken = {
    person_id_fk: req.body.change_date,
    token: req.body.change_reason,
    person_id_fk: person.id,
    created_at: new Date(),
  };
  exports.create = async (req, res) => {
    try {
      // Create a new record in the ChangePasswordToken table
      const changed_password_token = await ChangedPasswordToken.create(
        req.body,
      );
      res.send(changed_password_token);
    } catch (err) {
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while creating the changed_password_token.",
      });
    }
  };
};
// Retrieve all  from the database.
exports.findAll = (req, res) => {
  ChangedPasswordToken.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while retrieving changed_password_token.",
      });
    });
};

// Find a single  with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  ChangedPasswordToken.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find changed_password_token with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving changed_password_token with id=" + id,
      });
    });
};

// Update a  by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  ChangedPasswordToken.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "changed_password_token was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update changed_password_token with id=${id}. Maybe changed_password_token was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating  with id=" + id,
      });
    });
};

// Delete a  with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  ChangedPasswordToken.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "changed_password_token was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Company with id=${id}. Maybe changed_password_token was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete changed_password_token with id=" + id,
      });
    });
};

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  ChangedPasswordToken.destroy({
    where: {},
    truncate: false,
  })
    .then((nums) => {
      res.send({
        message: `${nums} changed_password_token were deleted successfully!`,
      });
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message ||
          "Some error occurred while removing all changed_password_token.",
      });
    });
};
