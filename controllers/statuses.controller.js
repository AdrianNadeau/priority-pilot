const db = require("../models");
const Status = db.statuses;
const Project = db.projects;
const Op = db.Sequelize.Op;

// Create and Save a new Status
exports.create = async (req, res) => {
  try {
    console.log("Status form data received:", req.body);

    // Validate critical fields before processing - ensure they are ONLY numbers
    if (req.body.project_id) {
      const projectIdStr = String(req.body.project_id).trim();
      if (!/^\d+$/.test(projectIdStr)) {
        console.error(
          "Invalid project_id format (contains non-digits):",
          projectIdStr,
        );
        return res.status(400).send({ message: "Invalid project ID format." });
      }
    }
    if (req.body.prime_id_fk) {
      const primeIdStr = String(req.body.prime_id_fk).trim();
      if (!/^\d+$/.test(primeIdStr)) {
        console.error(
          "Invalid prime_id_fk format (contains non-digits):",
          primeIdStr,
        );
        return res.status(400).send({ message: "Invalid prime ID format." });
      }
    }

    const statusDate = req.body.status_date;
    if (!statusDate || isNaN(new Date(statusDate).getTime())) {
      return res.status(400).send({ message: "Invalid status date provided." });
    }

    const parsedStatusDate = new Date(statusDate);
    const adjustedStatusDate = new Date(
      parsedStatusDate.getTime() + parsedStatusDate.getTimezoneOffset() * 60000,
    );

    const status = {
      project_id_fk:
        req.body.project_id &&
        !isNaN(parseInt(req.body.project_id, 10)) &&
        parseInt(req.body.project_id, 10) > 0
          ? parseInt(req.body.project_id, 10)
          : undefined,
      prime_id_fk:
        req.body.prime_id_fk &&
        !isNaN(parseInt(req.body.prime_id_fk, 10)) &&
        parseInt(req.body.prime_id_fk, 10) > 0
          ? parseInt(req.body.prime_id_fk, 10)
          : undefined,
      progress: req.body.progress ? String(req.body.progress).trim() : null,
      health: req.body.health ? String(req.body.health).trim() : null,
      issue: req.body.issue ? String(req.body.issue).trim() : null,
      actions: req.body.actions ? String(req.body.actions).trim() : null,
      accomplishments: req.body.status_accomplishments
        ? String(req.body.status_accomplishments).trim()
        : null,
      attachments: req.body.attachment
        ? String(req.body.attachment).trim()
        : null,
      status_date: adjustedStatusDate, // Save the adjusted date
    };

    // Remove undefined keys so Sequelize uses defaults or NULL
    Object.keys(status).forEach(
      (key) => status[key] === undefined && delete status[key],
    );

    console.log("Sanitized status object:", status);

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
    order: [["status_date", "DESC"]], // Corrected syntax for ordering
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
  const project_id_fk = parseInt(req.params.project_id_fk, 10);
  console.log("Finding statuses for project_id_fk:", project_id_fk);

  if (isNaN(project_id_fk)) {
    return res.status(400).send({
      message: "Invalid project ID",
    });
  }

  Status.findAll({ where: { project_id_fk }, order: [["status_date", "DESC"]] })
    .then((data) => {
      console.log(`Found ${data.length} statuses for project ${project_id_fk}`);
      res.send(data);
    })
    .catch((err) => {
      console.error("Error finding statuses:", err);
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving statuses.",
      });
    });
};

// Find a single Status with an id
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const status = await Status.findByPk(id);

    if (!status) {
      return res.status(404).send({ message: `Cannot find Status with id=${id}.` });
    }

    // If status has a prime_id_fk, fetch the prime person details
    let primeInfo = null;
    if (status.prime_id_fk) {
      const Person = db.persons;
      primeInfo = await Person.findByPk(status.prime_id_fk);
      console.log("Prime ID:", status.prime_id_fk);
      console.log("Prime Info:", primeInfo ? primeInfo.toJSON() : "Not found");
    }

    // Combine status data with prime info
    const response = {
      ...status.toJSON(),
      prime_first_name: primeInfo ? primeInfo.first_name : null,
      prime_last_name: primeInfo ? primeInfo.last_name : null
    };

    console.log("Response being sent:", response);
    res.send(response);
  } catch (err) {
    console.error("Error retrieving Status:", err);
    res.status(500).send({ message: "Error retrieving Status with id=" + id });
  }
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
