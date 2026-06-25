'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeeManager = sequelize.define(
    'EmployeeManager',
    {
      employee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      manager_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
    },
    {
      tableName: 'employee_manager',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['employee_id', 'manager_id'],
        },
      ],
    }
  );

  EmployeeManager.associate = (models) => {
    EmployeeManager.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'Employee',
    });
    EmployeeManager.belongsTo(models.User, {
      foreignKey: 'manager_id',
      as: 'Manager',
    });
  };

  return EmployeeManager;
};
