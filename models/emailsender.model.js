module.exports = (sequelize, Sequelize) => {
    const EmailSender = sequelize.define('EmailSender', {
      // Other fields...
      emailTo: {
        allowNull: false,
        type: Sequelize.STRING
      },
      templateId: {
        allowNull: false,
        type: Sequelize.STRING
      }

      
    });
  
    return EmailSender;
  };