module.exports = (sequelize, DataTypes) => {
  const ChangedPasswordToken = sequelize.define(
    "ChangedPasswordToken",
    {
      person_id_fk: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "changed_password_tokens", // Explicitly specify the table name
    },
  );

  return ChangedPasswordToken;
};
