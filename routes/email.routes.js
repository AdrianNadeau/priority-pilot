const emails = require("../models/emailsender.model.js");
var router = require("express").Router();

module.exports = app => {
    // send email
    router.post("/send", emails.send);
      
   
    app.use("/emails", router);
    
  };