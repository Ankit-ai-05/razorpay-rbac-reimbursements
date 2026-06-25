'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const { ROLES } = require('../utils/constants');

/**
 * @param {Sequelize} sequelize
 */
module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM(...Object.values(ROLES)),
        allowNull: false,
        defaultValue: ROLES.EMP,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'users',
      timestamps: false,
    }
  );

  User.associate = (models) => {
    // As employee: has one manager through EmployeeManager
    User.belongsToMany(models.User, {
      through: models.EmployeeManager,
      as: 'Managers',
      foreignKey: 'employee_id',
      otherKey: 'manager_id',
    });

    // As manager: has many employees through EmployeeManager
    User.belongsToMany(models.User, {
      through: models.EmployeeManager,
      as: 'Employees',
      foreignKey: 'manager_id',
      otherKey: 'employee_id',
    });

    // Has many reimbursements as the requester
    User.hasMany(models.Reimbursement, {
      foreignKey: 'employee_id',
      as: 'Reimbursements',
    });

    // Has many approval records as the approver
    User.hasMany(models.ReimbursementApproval, {
      foreignKey: 'approver_id',
      as: 'Approvals',
    });
  };

  return User;
};
