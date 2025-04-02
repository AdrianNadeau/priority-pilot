module.exports = (sequelize, Sequelize) => {
  const ChangePasswordToken = sequelize.define("changed_password_token", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    person_id_fk: {
      type: Sequelize.STRING,
      required: true,
    },
    token: {
      type: Sequelize.STRING,
      required: true,
    },
  });

  return ChangePasswordToken;
};
