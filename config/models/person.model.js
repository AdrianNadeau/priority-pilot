module.exports = (sequelize, Sequelize) => {
  const Person = sequelize.define("persons", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
      unique: true,
    },
    first_name: {
      type: Sequelize.STRING,
      required: true,
    },
    last_name: {
      type: Sequelize.STRING,
      required: true,
    },
    email: {
      type: Sequelize.STRING,
      required: true,
      unique: true,
    },
    password: {
      type: Sequelize.STRING,
      required: true,
    },
    initials: {
      type: Sequelize.STRING,
    },
    isAdmin: {
      type: Sequelize.BOOLEAN,
      default: false,
    },

    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    company_id_fk: {
      type: Sequelize.DataTypes.INTEGER,
    },
  });

  return Person;
};
