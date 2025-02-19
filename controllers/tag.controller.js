const db = require("../models");
const Tag = db.tags;
const Op = db.Sequelize.Op;

// Create and Save a new Tag
exports.create = (req, res) => {
  // Validate request

  if (!req.body.company_tag) {
    res.status(400).send({
      message: "Tag Name can not be empty!",
    });
    return;
  }

  // Create a Tag
  const tag = {
    tag_name: req.body.company_tag,
    company_id_fk: req.session.company.id,
  };

  // Save Tag in the databasecompany_id_fk = req.session.company.id;
  Tag.create(tag)
    .then((data) => {
      res.redirect("/companies/get/defaults");
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Tag.",
      });
    });
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
exports.update = (req, res) => {
  const id = req.params.id;
  Tag.update(req.body, {
    where: { id: id },
    returning: true, // Ensure the updated rows are returned
  })
    .then(([num, updatedTag]) => {
      if (num == 1) {
        console.log(
          "Tag was updated successfully. Direct back to defaults page",
        );
        res.redirect("/companies/get/defaults");
      } else {
        res.status(404).send({
          message: `Cannot update Tag with id=${id}. Maybe Tag was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error updating Tag with id=" + id,
      });
    });
};
// exports.updateFromDefaultsPage = (req, res) => {
//   console.log("req.body:", req.body);
//   const id = req.body.tag_id; // Extract the id from the request body
//   const updatedTag = {
//     tag_id: req.body.tag_id,
//     tag_name: req.body.tag_name,
//   };
//   console.log("updatedTag:", updatedTag);
//   Tag.update(updatedTag, {
//     where: { id: id },
//   })
//     .then((num) => {
//       if (num == 1) {
//         res.send({
//           message: "Tag was updated successfully.",
//         });
//       } else {
//         res.send({
//           message: `Cannot update Tag with id=${id}. Maybe Tag was not found or req.body is empty!`,
//         });
//       }
//     })
//     .catch((err) => {
//       res.status(500).send({
//         message: "Error updating Tag with id=" + id,
//       });
//     });
// };
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
