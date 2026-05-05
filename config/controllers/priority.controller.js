const db = require("../models");
const Priority = db.priorities;
const Op = db.Sequelize.Op;

// Create and Save a new Priority
exports.create = async (req, res, next) => {
  try {
    if (!req.body.priority_name) {
      const error = new Error("Priority Name cannot be empty!");
      error.statusCode = 400;
      throw error;
    }

    const priority = {
      priority_name: req.body.priority_name,
      priority_description: req.body.priority_description,
    };

    const data = await Priority.create(priority);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

// Retrieve all Priorities from the database
exports.findAll = async (req, res, next) => {
  try {
    const priority_name = req.query.priority_name;
    const condition = priority_name
      ? { priority_name: { [Op.iLike]: `%${priority_name}%` } }
      : null;

    const data = await Priority.findAll({ where: condition });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Find a single Priority by ID
exports.findOne = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = await Priority.findByPk(id);

    if (!data) {
      const error = new Error(`Priority with id=${id} not found.`);
      error.statusCode = 404;
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// Update a Priority by ID
exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [updated] = await Priority.update(req.body, { where: { id } });

    if (updated === 0) {
      const error = new Error(
        `Cannot update Priority with id=${id}. Maybe Priority was not found or req.body is empty!`,
      );
      error.statusCode = 400;
      throw error;
    }

    res.json({ message: "Priority updated successfully." });
  } catch (err) {
    next(err);
  }
};

// Delete a Priority by ID
exports.delete = async (req, res, next) => {
  try {
    const id = req.params.id;
    const deleted = await Priority.destroy({ where: { id } });

    if (deleted === 0) {
      const error = new Error(
        `Cannot delete Priority with id=${id}. Maybe Priority was not found!`,
      );
      error.statusCode = 404;
      throw error;
    }

    res.json({ message: "Priority deleted successfully!" });
  } catch (err) {
    next(err);
  }
};

// Delete all Priorities
exports.deleteAll = async (req, res, next) => {
  try {
    const deleted = await Priority.destroy({ where: {}, truncate: false });

    res.json({ message: `${deleted} Priorities were deleted successfully!` });
  } catch (err) {
    next(err);
  }
};
