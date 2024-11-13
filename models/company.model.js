module.exports = (sequelize, Sequelize) => {
  const Company = sequelize.define("company", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    company_name: {
      type: Sequelize.STRING,
      required: true,
    },
    company_headline: {
      type: Sequelize.STRING,
    },
    company_description: {
      type: Sequelize.STRING,
    },
    company_logo: {
      type: Sequelize.STRING,
    },
    portfoilio_budget: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
  });

  return Company;
};
