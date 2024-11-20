const db = require("../models"); // Adjust the path as needed
const ChangedProject = db.changed_projects;
const ChangeReason = db.change_reasons;

// Create and Save a new ChangedProject
exports.create = async (req, res) => {
  try {
    if (!req.session.company) return res.redirect("/login");
    const company_id_fk = req.session.company.id;

    if (!req.body.project_name) {
      return res.status(400).send({ message: "Project Name cannot be empty!" });
    }

    const changed_project = {
      project_name: req.body.project_name,
      start_date: req.body.start_date ? new Date(req.body.start_date) : null,
      end_date: req.body.end_date ? new Date(req.body.end_date) : null,
      company_id_fk: company_id_fk,
      project_id_fk: project_id_fk,
      project_name: req.body.project_name,
      project_headline: req.body.project_headline,
      project_description: req.body.project_description,
      project_why: req.body.project_why,
      project_what: req.body.project_what,
      priority_id_fk: req.body.priority_id_fk,
      sponsor_id_fk: req.body.sponsor_id_fk,
      prime_id_fk: req.body.prime_id_fk,
      phase_id_fk: req.body.phase_id_fk,
      project_cost: req.body.project_cost,
      effort: req.body.effort,
      benefit: req.body.benefit,
      complexity: req.body.complexity,
      tags: req.body.tags,
      change_reason_id_fk: req.body.change_reason,
      change_explanation: req.body.change_explanation,
    };

    await ChangedProject.create(changed_project);
    res.redirect("/projects/");
  } catch (err) {
    console.error("Error creating ChangedProject:", err);
    res
      .status(500)
      .send({ message: "Error occurred while creating the ChangedProject." });
  }
};

exports.findAll = async (req, res) => {
  try {
    console.log("ChangedProject", ChangedProject);
    const changedProjects = await ChangedProject.findAll();
    res.status(200).send(changedProjects);
  } catch (err) {
    console.error("Error retrieving ChangedProjects:", err);
    res.status(500).send({
      message: "Error occurred while retrieving the ChangedProjects.",
    });
  }
};

exports.findAllByProjectId = async (req, res) => {
  if (!req.session.company) return res.redirect("/login");
  const company_id_fk = req.session.company.id;
  const changed_id = req.params.id;
  console.log("changed_id", changed_id);
  console.log("ChangedProject", ChangedProject);
  try {
    const changedProjects = await ChangedProject.findAll({
      changed_id: changed_id,
    });
    res.status(200).send(changedProjects);
  } catch (err) {
    console.error("Error retrieving ChangedProjects:", err);
    res.status(500).send({
      message: "Error occurred while retrieving the ChangedProjects.",
    });
  }
};

// Retrieve a single ChangedProject by ID
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("id", id);
    const changedProject = await ChangedProject.findByPk(id);
    if (!changedProject) {
      return res
        .status(404)
        .send({ message: `ChangedProject with id=${id} not found.` });
    }
    res.status(200).send(changedProject);
  } catch (err) {
    console.error("Error retrieving ChangedProject:", err);
    res
      .status(500)
      .send({ message: "Error occurred while retrieving the ChangedProject." });
  }
};

// Update a ChangedProject by the ID in the request
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await ChangedProject.update(req.body, {
      where: { id: id },
    });
    if (!updated) {
      return res
        .status(404)
        .send({ message: `ChangedProject with id=${id} not found.` });
    }
    res.status(200).send({ message: "ChangedProject updated successfully." });
  } catch (err) {
    console.error("Error updating ChangedProject:", err);
    res
      .status(500)
      .send({ message: "Error occurred while updating the ChangedProject." });
  }
};

// Delete a ChangedProject with the specified ID in the request
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await ChangedProject.destroy({
      where: { id: id },
    });
    if (!deleted) {
      return res
        .status(404)
        .send({ message: `ChangedProject with id=${id} not found.` });
    }
    res.status(200).send({ message: "ChangedProject deleted successfully." });
  } catch (err) {
    console.error("Error deleting ChangedProject:", err);
    res
      .status(500)
      .send({ message: "Error occurred while deleting the ChangedProject." });
  }
};
