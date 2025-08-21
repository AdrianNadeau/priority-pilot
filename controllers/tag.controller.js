const db = require("../models");
const Tag = db.tags;

// Create and Save a new Tag
exports.create = async (req, res, next) => {
  try {
    const tagName = req.body.tag_name;
    const tagColor = req.body.tag_color;

    // Validate tag name
    if (!tagName || tagName.trim() === "") {
      const error = new Error("Error adding tag: Tag name required.");
      error.statusCode = 401;

      return next(error);
    }

    // Validate tag color
    if (!tagColor) {
      const error = new Error("Error adding tag: Tag color is required.");
      error.statusCode = 401;
      return next(error);
    }

    // Check for same tag color within the same company
    const existingTags = await Tag.findAll({
      where: {
        tag_color: tagColor,
        company_id_fk: req.session.company.id,
      },
    });
    if (existingTags && existingTags.length > 0) {
      const error = new Error(
        "Error adding tag. Tag color must be unique within your company.",
      );
      error.statusCode = 500;

      return next(error);
    }

    // Create a Tag
    const tag = {
      tag_name: tagName.trim(),
      tag_color: tagColor,
      company_id_fk: req.session.company.id,
    };

    // Save Tag in the database
    const data = await Tag.create(tag);
    res.redirect("/companies/get/defaults");
  } catch (err) {
    console.log("Error creating tag:", err);
    // For validation or expected errors, redirect back to the defaults page
    // and surface the error message via a query parameter so the UI can show it.
    if (err.statusCode) {
      return res.redirect(
        "/companies/get/defaults?error=" + encodeURIComponent(err.message),
      );
    } else {
      // Unexpected server errors: respond with 500 as before
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Tag.",
      });
    }
  }
};
// Retrieve all  from the database.
exports.findAll = (req, res) => {
  // const tag_name = req.query.tag_name;
  Tag.findAll({})
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving tags.",
      });
    });
};

// Find a single Tag with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Tag.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Tag with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Tag with id=" + id,
      });
    });
};

// Update a Tag by the id in the request
exports.update = async (req, res) => {
  try {
    console.log("tag_color:", req.body.tag_color);
    const id = req.params.id;
    const tagColor = req.body.tag_color;

    // If color is being updated, check for uniqueness
    if (tagColor) {
      const existingTags = await Tag.findAll({
        where: {
          tag_color: tagColor,
          company_id_fk: req.session.company.id,
          id: { [db.Sequelize.Op.ne]: id }, // Exclude current tag from check
        },
      });

      if (existingTags && existingTags.length > 0) {
        return res.status(400).send({
          message:
            "Error updating tag. Tag color must be unique within your company.",
        });
      }
    }

    const [num, updatedTag] = await Tag.update(req.body, {
      where: { id: id },
      returning: true, // Ensure the updated rows are returned
    });

    if (num == 1) {
      console.log("Tag was updated successfully. Direct back to defaults page");
      res.redirect("/companies/get/defaults");
    } else {
      res.status(404).send({
        message: `Cannot update Tag with id=${id}. Maybe Tag was not found or req.body is empty!`,
      });
    }
  } catch (err) {
    console.log("Error updating tag:", err);
    res.status(500).send({
      message: "Error updating Tag with id=" + id,
    });
  }
};
// Delete a Tag with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  console.log("DELETE ID", id);
  Tag.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Tag was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete Tag with id=${id}. Maybe Tag was not found!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Tag with id=" + id,
      });
    });
};

// Delete all  from the database.
exports.deleteAll = (req, res) => {
  // Tag.destroy({
  //   where: {},
  //   truncate: false,
  // })
  //   .then((nums) => {
  //     res.send({ message: `${nums} Companies were deleted successfully!` });
  //   })
  //   .catch((err) => {
  //     res.status(500).send({
  //       message:
  //         err.message || "Some error occurred while removing all companies.",
  //     });
  //   });
};
