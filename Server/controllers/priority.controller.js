const db = require("../models/server");
const Priority = db.priorities;
const Op = db.Sequelize.Op;

// Create and Save a new Priority
exports.create = (req, res) => {
    // Validate request
    if (!req.body.priority_name) {
      res.status(400).send({
        message: "Priority Name can not be empty!"
      });
      return;
    }
  
    // Create a Priority
    const priority = {
      priority_name: req.body.priority_name,
      priority_description: req.body.priority_description,
    };
    // console.log("+++++++++++++++++++++++++++++ priority: ",priority)
    // Save Priority in the database
    Priority.create(priority)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the Priority."
        });
      });
  };

// Retrieve all  from the database.
exports.findAll = (req, res) => {
    const priority_name = req.query.priority_name;
    var condition = priority_name ? { priority_name: { [Op.iLike]: `%${company_name}%` } } : null;
  
    Priority.findAll({ where: condition })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving companies."
        });
      });
  };

// Find a single Priority with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
  
    Priority.findByPk(id)
      .then(data => {
        if (data) {
          res.send(data);
        } else {
          res.status(404).send({
            message: `Cannot find Priority with id=${id}.`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving Priority with id=" + id
        });
      });
  };

// Update a Priority by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;
  
    Priority.update(req.body, {
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Priority was updated successfully."
          });
        } else {
          res.send({
            message: `Cannot update Priority with id=${id}. Maybe Priority was not found or req.body is empty!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating Priority with id=" + id
        });
      });
  };

// Delete a Priority with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
  
    Priority.destroy({
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Priority was deleted successfully!"
          });
        } else {
          res.send({
            message: `Cannot delete Priority with id=${id}. Maybe Priority was not found!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Could not delete Priority with id=" + id
        });
      });
  };

// Delete all  from the database.
exports.deleteAll = (req, res) => {
    Priority.destroy({
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

