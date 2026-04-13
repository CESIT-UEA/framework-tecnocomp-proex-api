module.exports = (sequelize, DataTypes) => {
    const SaibaMais = sequelize.define('SaibaMais', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_topico: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      descricao: {
        type: DataTypes.STRING,
      },
      url: {
        type: DataTypes.STRING,
      },
    }, {
      tableName: 'saibaMais',
      timestamps: false,
    });
    return SaibaMais;
  };
  