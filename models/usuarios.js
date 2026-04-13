module.exports = (sequelize, DataTypes) => {
    const Usuarios = sequelize.define('Usuarios', {
      ltiUserId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      nome: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
      },
      ltik: {
        type: DataTypes.STRING,
      }
    }, {
      tableName: 'usuarios',
      timestamps: false,
    });
    return Usuarios;
  };
  