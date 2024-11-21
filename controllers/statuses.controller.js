const db = require("../models");
const Status = db.statuses;
const Project = db.projects;
const Op = db.Sequelize.Op;

// Create and Save a new Status
exports.create = async (req, res) => {
  try {
    let prime_id = req.body.prime_id_fk;
    const status_date = req.body.status_date;
    console.log("******************************* status_date: ", status_date);

    if (!prime_id) {
      prime_id = null;
    }
    // Create a Status
    const status = {
      project_id_fk: req.body.project_id,
      prime_id_fk: req.body.prime_id_fk,
      progress: req.body.progress,
      health: req.body.health,
      issue: req.body.issue,
      actions: req.body.actions,
      accomplishments: req.body.status_accomplishments,
      attachments: req.body.attachment,
      status_date: req.body.status_date,
    };

    // Save Status in the database
    const data = await Status.create(status);

    const id = req.body.project_id;

    const project = await Project.findByPk(id, {
      where: { project_id: id },
    });

    const primeOnly = req.body.prime_only;
    if (project) {
      console.log("update project health: ", req.body.health);
      await project.update({ health: req.body.health });
      //back to dashboard if not admin
      res.redirect("/");
    } else {
      res.send({
        message: `Cannot update Project with id=${id}. Maybe Project was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Error updating Project with id=" + req.body.project_id,
      error: err.message,
    });
  }
};

// Retrieve all  from the database.
exports.findAll = (req, res) => {
  Status.findAll({})
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

// Retrieve all by projectId from the database.
exports.findAllByProjectId = (req, res) => {
  const project_id_fk = req.params.project_id_fk;
  Status.findAll({
    where: { project_id_fk },
    order: [["createdAt", "DESC"]],
  })
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
        res.status(404).send({
          message: `Cannot find Status with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Status with id=" + id,
      });
    });
};

// Update a Status by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Status.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Status was updated successfully.",
        });
      } else {
        res.send({
          message: `Cannot update Status with id=${id}. Maybe Status was not found or req.body is empty or violates foreign key contstraint!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Status with id=" + id,
      });
    });
};

// Delete a Status with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Status.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Status was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Status with id=${id}. Maybe Status was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Status with id=" + id,
      });
    });
};

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  Status.destroy({
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
