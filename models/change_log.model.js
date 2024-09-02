module.exports = (sequelize, Sequelize) => {
  const ChangeLog = sequelize.define("change_logs", {
      id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        project_id_fk: {
          
          type: Sequelize.INTEGER
        },
        change_date: {
          type: Sequelize.DATE
        },
        //integer
        change_reason: {
          type: Sequelize.STRING
        },
        change_headline: {
          type: Sequelize.STRING
        },
        change_explanation: {
          type: Sequelize.STRING
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        company_id_fk: {
          type: Sequelize.DataTypes.INTEGER,
          // references: {
          //   model: {
          //     tableName: 'companies',
          //     schema: 'public'
          //   },
          //   key: 'id'
          // },
          // allowNull: false
        }
      });

  return ChangeLog;
};