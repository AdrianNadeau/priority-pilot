const db = require("../models");
const ChangeLog = db.change_logs;
const Op = db.Sequelize.Op;

// Create and Save a new 
exports.create = (req, res) => {
  // Validate request
  if (!req.body.email) {
    res.status(400).send({
      message: "Email can not be empty!"
    });
    return;
  }
  
  // Create a 
  const change_log = {
    change_date: req.body.change_date,
    change_reason: req.body.change_reason,
    change_headline: req.body.change_headline,
    change_explanation: req.body.change_explanation,
    company_id_fk: req.body.company_id_fk
  };
  
  // Save  in the database
  ChangeLog.create(change_log)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
            err.message || "Some error occurred while creating the Company."
      });
    });
};

// Retrieve all  from the database.
// exports.findAll = (req, res) => {
//     const first_name = req.query.first_name;
//     var condition = company_name ? { first_name: { [Op.iLike]: `%${first_name}%` } } : null;
  
//     ChangeLog.findAll({ where: condition })
//       .then(data => {
//         res.send(data);
//       })
//       .catch(err => {
//         res.status(500).send({
//           message:
//             err.message || "Some error occurred while retrieving people."
//         });
//       });
//   };

// Find a single  with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  
  ChangeLog.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Company with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Company with id=" + id
      });
    });
};

// Update a  by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  
  ChangeLog.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Company was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Company with id=${id}. Maybe Company was not found or req.body is empty!`
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
  
  ChangeLog.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Company was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Company with id=${id}. Maybe Company was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Company with id=" + id
      });
    });
};

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  ChangeLog.destroy({
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

