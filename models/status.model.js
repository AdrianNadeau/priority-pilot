module.exports = (sequelize, Sequelize) => {
  const Status = sequelize.define("statuses", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    project_id_fk: {
      type: Sequelize.INTEGER
    },
    prime_id_fk: {
      type: Sequelize.INTEGER
    },
    status_date: {
      type: Sequelize.DATE
    },
    progress: {
      type: Sequelize.STRING
    },
    issue: {
      type: Sequelize.STRING
    },
    
    actions: {
      type: Sequelize.STRING
    },
    accomplishments: {
      type: Sequelize.STRING
    },
    health: {
      type: Sequelize.STRING
    },
    attachment: {
      type: Sequelize.STRING
    }
   
  });

  return Status;
};