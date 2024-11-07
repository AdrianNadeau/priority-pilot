module.exports = (sequelize, Sequelize) => {
  const Project = sequelize.define("projects", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    company_id_fk: {
      type: Sequelize.INTEGER,
      required: true,
      unique: true,
    },
    project_name: {
      type: Sequelize.STRING,
    },
    project_headline: {
      type: Sequelize.STRING,
    },
    project_description: {
      type: Sequelize.STRING,
    },
    project_why: {
      type: Sequelize.STRING,
    },
    project_what: {
      type: Sequelize.STRING,
    },
    health: {
      type: Sequelize.STRING,
      default: "",
    },
    start_date: {
      type: Sequelize.DATE,
    },
    end_date: {
      type: Sequelize.DATE,
    },
    next_milestone_date: {
      type: Sequelize.DATE,
    },

    phase_id_fk: {
      type: Sequelize.INTEGER,
    },
    priority_id_fk: {
      type: Sequelize.INTEGER,
    },

    sponsor_id_fk: {
      type: Sequelize.INTEGER,
    },
    prime_id_fk: {
      type: Sequelize.INTEGER,
    },
    project_cost: {
      type: Sequelize.STRING,
    },
    effort: {
      type: Sequelize.STRING,
    },
    benefit: {
      type: Sequelize.STRING,
    },
    impact: {
      type: Sequelize.INTEGER,
    },
    complexity: {
      type: Sequelize.INTEGER,
    },
    tags: {
      type: Sequelize.STRING,
    },
    deleted_date: {
      type: Sequelize.DATE,
    },
    deleted_yn: {
      type: Sequelize.BOOLEAN,
      default: false,
    },
    change_date: {
      type: Sequelize.DATE,
    },
    pitch_message: {
      type: Sequelize.STRING,
    },
  });

  return Project;
};
