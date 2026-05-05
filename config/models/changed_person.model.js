module.exports = (sequelize, Sequelize) => {
  const ChangedPerson = sequelize.define("changed_persons", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    person_id_fk: {
      type: Sequelize.INTEGER,
      required: true,
    },
    company_id_fk: {
      type: Sequelize.INTEGER,
    },
    first_name: {
      type: Sequelize.STRING,
    },
    last_name: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    initials: {
      type: Sequelize.STRING,
    },
    isAdmin: {
      type: Sequelize.BOOLEAN,
    },
    change_date: {
      type: Sequelize.DATE,
    },
    changed_by_id_fk: {
      type: Sequelize.INTEGER,
    },
  });

  return ChangedPerson;
};
