const db = require("../models/server");
const Status = db.statuses;
const Project = db.projects;
const Op = db.Sequelize.Op;

// Create and Save a new Status
exports.create = (req, res) => {
  console.log("PROJECT STATUS : ",req.body.status_accomplishments)
  const currentDate = new Date();
  console.log("currentDate",currentDate)
    // Create a Status
    const status = {
      project_id_fk: req.body.project_id,
      prime_id_fk: req.body.prime_id,
      progress: req.body.progress,
      health: req.body.health,
      issue: req.body.issue,
      actions: req.body.actions,
      accomplishments: req.body.status_accomplishments,
      attachments: req.body.attachment,
    };
    console.log("status:",status.accomplishments)
    // Save Status in the database
    Status.create(status)
      .then(data => {
        // console.log("data:",data)
        //rendor cockpit page again and confirm status update text displays in the change log (add it to db table?)
        res.redirect('/projects/cockpit/'+data.project_id_fk);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the Status."
        });
      });
  };

// Retrieve all  from the database.
exports.findAll = (req, res) => {
    // const company_name = req.query.company_name;
    // var condition = company_name ? { company_name: { [Op.iLike]: `%${company_name}%` } } : null;
  
    Status.findAll({ })
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

// Find a single Status with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
  
    Status.findByPk(id)
      .then(data => {
        if (data) {
          res.send(data);
        } else {
          res.status(404).send({
            message: `Cannot find Status with id=${id}.`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error retrieving Status with id=" + id
        });
      });
  };

// Update a Status by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;
  
    Status.update(req.body, {
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Status was updated successfully."
          });
        } else {
          res.send({
            message: `Cannot update Status with id=${id}. Maybe Status was not found or req.body is empty or violates foreign key contstraint!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Error updating Status with id=" + id
        });
      });
  };

// Delete a Status with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
  
    Status.destroy({
      where: { id: id }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Status was deleted successfully!"
          });
        } else {
          res.send({
            message: `Cannot delete Status with id=${id}. Maybe Status was not found!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Could not delete Status with id=" + id
        });
      });
  };

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  Status.destroy({
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

