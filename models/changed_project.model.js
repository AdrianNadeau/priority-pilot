module.exports = (sequelize, Sequelize) => {
  const ChangedProject = sequelize.define("changed_projects", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    project_id_fk: {
      type: Sequelize.INTEGER,
      required: true,
    },
    company_id_fk: {
      type: Sequelize.INTEGER,
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
      type: Sequelize.STRING,
      default: "n",
    },
    change_date: {
      type: Sequelize.DATE,
    },
    pitch_message: {
      type: Sequelize.STRING,
    },
    change_reason_id_fk: {
      type: Sequelize.INTEGER,
    },
    change_explanation: {
      type: Sequelize.STRING,
    },
  });

  return ChangedProject;
};
