module.exports = (sequelize, DataTypes) => {
  const ChangedPasswordToken = sequelize.define(
    "ChangedPasswordToken",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      person_id_fk: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "persons",
          key: "id",
        },
      },
      token: {
        type: DataTypes.STRING,

        unique: true,
      },
      email: {
        type: DataTypes.STRING,
      },
      created_at: {
        type: DataTypes.DATE,

        defaultValue: DataTypes.NOW,
      },
      expires_at: {
        type: DataTypes.DATE,

        defaultValue: () => new Date(Date.now() + 3600000), // 1 hour from now
      },
    },
    {
      timestamps: false,
      tableName: "changed_password_tokens",
    },
  );

  return ChangedPasswordToken;
};
