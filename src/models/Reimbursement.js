'use strict';

const { DataTypes } = require('sequelize');
const { REIMBURSEMENT_STATUS } = require('../utils/constants');

module.exports = (sequelize) => {
  const Reimbursement = sequelize.define(
    'Reimbursement',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 200],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 0.01,
        },
      },
      final_status: {
        type: DataTypes.ENUM(...Object.values(REIMBURSEMENT_STATUS)),
        allowNull: false,
        defaultValue: REIMBURSEMENT_STATUS.PENDING,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'reimbursements',
      timestamps: false,
    }
  );

  Reimbursement.associate = (models) => {
    Reimbursement.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'Employee',
    });

    Reimbursement.hasMany(models.ReimbursementApproval, {
      foreignKey: 'reimbursement_id',
      as: 'Approvals',
    });
  };

  return Reimbursement;
};
