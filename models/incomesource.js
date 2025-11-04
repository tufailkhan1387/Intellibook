module.exports = (sequelize, DataTypes) => {
  const incomesource = sequelize.define("incomesource", {
    incomeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subType: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    fromAmount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
    },
    toAmount: {
       type: DataTypes.DECIMAL(10,2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
   

   
  });

  incomesource.associate = (models) => {
  };
  return incomesource;
};
