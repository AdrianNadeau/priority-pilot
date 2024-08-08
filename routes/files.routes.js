// const db = require("../models/file.model.js");
// const File = db.companies;
// const Person = db.persons;
// const Op = db.Sequelize.Op;

// const util = require("util");
// const multer = require("multer");
// const maxSize = 2 * 1024 * 1024;
// const  logosFolderLocation = __basedir + "/public/aseets/images/logos/"
// let storage = multer.diskStorage({
//   destination: (req, file, cb) => {logosFolderLocation
//     cb(null,);//public\assets\images\logos
//   },
//   filename: (req, file, cb) => {
//     console.log(file.originalname);
//     cb(null, file.originalname);
//   },
// });

// let uploadFile = multer({
//   storage: storage,
//   limits: { fileSize: maxSize },
// }).single("file");

// let uploadFileMiddleware = util.promisify(uploadFile);
// module.exports = uploadFileMiddleware;

module.exports = app => {
  const files = require("../controllers/file.controller.js");

  var router = require("express").Router();

  // Create a new Tag
  
  router.post("/uploadlogo", files.upload);

  // Retrieve all Companies
  router.get("/listfiles", files.getListFiles);

  // Retrieve a single Tag with id
  router.get("/download", files.download);

  app.use('/files', router);
};
