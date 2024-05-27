const db = require("../models");
const Phase = db.phases;
const Op = db.Sequelize.Op;

// Create and Save a new Phase
exports.create = (req, res) => {
    // Validate request
   
    if (!req.body.phase_name) {
      res.status(400).send({
        message: "Phase Name can not be empty!"
      });
      return;
    }
  
    // Create a Phase
    const phase = {
      phase_name: req.body.phase_name,
      phase_description: req.body.phase_description,
    };

    // Save Phase in the database
    Phase.create(phase)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the Phase."
        });
      });
  };

// Retrieve all Phases from the database.
exports.findAll = (req, res) => {
    
    Phase.findAll({})
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving phases."
        });
      });
  };

// Find a single Phase with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
  
    Phase.findByPk(id)
      .then(data => {
        if (data) {
          res.send(data);
        } else {
          res.status(404).send({
            message: `Cannot find Phase with id=${id}.`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving Phase with id=" + id
        });
      });
  };

// Update a Phase by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;
  
    Phase.update(req.body, {
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Phase was updated successfully."
          });
        } else {
          res.send({
            message: `Cannot update Phase with id=${id}. Maybe Phase was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating Phase with id=" + id
        });
      });
  };

// Delete a Phase with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
  
    Phase.destroy({
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Phase was deleted successfully!"
          });
        } else {
          res.send({
            message: `Cannot delete Phase with id=${id}. Maybe Phase was not found!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Could not delete Phase with id=" + id
        });
      });
  };

// Delete all  from the database.
exports.deleteAll = (req, res) => {
    Phase.destroy({
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

