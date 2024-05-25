const db = require("../models/server");
const ChangeLog = db.change_logs;
const Op = db.Sequelize.Op;

// Create and Save a new 
exports.create = (req, res) => {
    // Validate request
    const project_id = req.body.project_id;
    console.log("project_id:",project_id)
    let company_id_fk;
    try{
    
      if(!req.session){
          res.redirect("/pages-500")
      }
      else{
        company_id_fk = req.session.company.id
       }
    }catch(error){
      console.log("error:",error)
    }  

    let currentDate = new Date();
    console.log(currentDate);
    const change_log = {
      change_date:currentDate,
      change_reason: req.body.change_reason,
      change_headline: req.body.change_headline,
      change_explanation: req.body.change_explanation,
      project_id_fk: project_id,
      company_id_fk: company_id_fk
      
    };
    console.log("change_log:",change_log)
    // Save  in the database
    ChangeLog.create(change_log)
      .then(data => {
        // res.send(data);
        res.redirect("/projects/cockpit/"+project_id)
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while creating the Company."
        });
      });
  };

// Retrieve all  from the database.
exports.findAll = (req, res) => {
  
    ChangeLog.findAll({
      order: [
        ['change_date', 'ASC']
      ]
    })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving people."
        });
      });
  };

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

exports.findAllByProject = (req, res) => {
  console.log("FIND PROJECT CHANGES")
    try{
    
      if(!req.session){
          res.redirect("/pages-500")
      }
      else{
        company_id_fk = req.session.company.id
       }
    }catch(error){
      console.log("error:",error)
    }    
  
  // const project_id  = req.params.project_id;
  
  //   ChangeLog.find({project_id_fk: project_id, company_id_fk:company_id_fk })
  //     .then(data => {
  //       if (data) {
  //         res.send(data);
          
  //       } else {
  //         res.status(404).send({
  //           message: `Cannot find Company with id=${id}.`
  //         });
  //       }
  //     })
  //     .catch(err => {
  //       res.status(500).send({
  //         message: "Error retrieving Company with id=" + id
  //       });
  //     });
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

