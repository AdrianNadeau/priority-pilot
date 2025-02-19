module.exports = (sequelize, Sequelize) => {
  const Tag = sequelize.define("tags", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    tag_name: {
      type: Sequelize.STRING,
    },
    company_id_fk: {
      type: Sequelize.DataTypes.INTEGER,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });

  return Tag;
};
