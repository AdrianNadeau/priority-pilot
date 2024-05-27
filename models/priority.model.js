module.exports = (sequelize, Sequelize) => {
  const Priority = sequelize.define("priorities", {
      
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        priority_name: {
          type: Sequelize.STRING,
          required: true
        },
        priority_description: {
          type: Sequelize.STRING
        },
      });

  return Priority;
};

