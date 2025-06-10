const db = require("../models");
const Status = db.statuses;
const Project = db.projects;
const Op = db.Sequelize.Op;

// Create and Save a new Status
exports.create = async (req, res) => {
  try {
    const statusDate = req.body.status_date;
    console.log("Received status date:", statusDate);
    if (!statusDate || isNaN(new Date(statusDate).getTime())) {
      return res.status(400).send({ message: "Invalid status date provided." });
    }

    const parsedStatusDate = new Date(statusDate);
    const adjustedStatusDate = new Date(
      parsedStatusDate.getTime() + parsedStatusDate.getTimezoneOffset() * 60000,
    );

    const status = {
      project_id_fk: req.body.project_id,
      prime_id_fk: req.body.prime_id_fk,
      progress: req.body.progress,
      health: req.body.health,
      issue: req.body.issue,
      actions: req.body.actions,
      accomplishments: req.body.status_accomplishments,
      attachments: req.body.attachment,
      status_date: adjustedStatusDate, // Save the adjusted date
    };

    const data = await Status.create(status);

    res.redirect("/");
  } catch (err) {
    console.error("Error creating status:", err);
    res
      .status(500)
      .send({ message: "Error creating status.", error: err.message });
  }
};

// Retrieve all  from the database.
exports.findAll = (req, res) => {
  Status.findAll({
    order: [["createdAt", "DESC"]], // Corrected syntax for ordering
  })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving statuses.",
      });
    });
};

// Retrieve all by projectId from the database.
exports.findAllByProjectId = (req, res) => {
  const project_id_fk = req.params.project_id_fk;
  Status.findAll({ where: { project_id_fk }, order: [["status_date", "DESC"]] })
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

// Find a single Status with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Status.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({ message: `Cannot find Status with id=${id}.` });
      }
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Error retrieving Status with id=" + id });
    });
};

// Update a Status by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Status.update(req.body, { where: { id: id } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Status was updated successfully." });
      } else {
        res.send({
          message: `Cannot update Status with id=${id}. Maybe Status was not found or req.body is empty or violates foreign key contstraint!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error updating Status with id=" + id });
    });
};

// Delete a Status with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Status.destroy({ where: { id: id } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "Status was deleted successfully!" });
      } else {
        res.send({
          message: `Cannot delete Status with id=${id}. Maybe Status was not found!`,
        });
      }
    })
    .catch((err) => {
      res
        .status(500)
        .send({ message: "Could not delete Status with id=" + id });
    });
};

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  Status.destroy({ where: {}, truncate: false })
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
