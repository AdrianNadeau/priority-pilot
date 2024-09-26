
module.exports = (sequelize, Sequelize) => {
  const ChangeReason = sequelize.define("change_reasons", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    change_reason: {
      type: Sequelize.STRING,
      required: true
    },
          
  });
  
  return ChangeReason;
};