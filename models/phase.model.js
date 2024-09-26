
module.exports = (sequelize, Sequelize) => {
  const Phase = sequelize.define("phases", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    phase_name: {
      type: Sequelize.STRING,
      required: true
    },
    phase_description: {
      type: Sequelize.STRING
    },
       
        
  });

  return Phase;
};