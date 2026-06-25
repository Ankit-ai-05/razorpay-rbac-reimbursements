'use strict';

const { DataTypes } = require('sequelize');
const { ROLES, DECISION } = require('../utils/constants');

module.exports = (sequelize) => {
  const ReimbursementApproval = sequelize.define(
    'ReimbursementApproval',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      reimbursement_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'reimbursements', key: 'id' },
        onDelete: 'CASCADE',
      },
      approver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      approver_role: {
        type: DataTypes.ENUM(ROLES.RM, ROLES.APE, ROLES.CFO),
        allowNull: false,
      },
      decision: {
        type: DataTypes.ENUM(...Object.values(DECISION)),
        allowNull: false,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'reimbursement_approvals',
      timestamps: false,
    }
  );

  ReimbursementApproval.associate = (models) => {
    ReimbursementApproval.belongsTo(models.Reimbursement, {
      foreignKey: 'reimbursement_id',
      as: 'Reimbursement',
    });

    ReimbursementApproval.belongsTo(models.User, {
      foreignKey: 'approver_id',
      as: 'Approver',
    });
  };

  return ReimbursementApproval;
};
