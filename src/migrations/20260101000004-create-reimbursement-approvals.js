'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reimbursement_approvals', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      reimbursement_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: { model: 'reimbursements', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      approver_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      approver_role: {
        type: Sequelize.DataTypes.ENUM('RM', 'APE', 'CFO'),
        allowNull: false,
      },
      decision: {
        type: Sequelize.DataTypes.ENUM('APPROVED', 'REJECTED'),
        allowNull: false,
      },
      remarks: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('reimbursement_approvals', ['reimbursement_id'], {
      name: 'approvals_reimbursement_id_idx',
    });
    await queryInterface.addIndex('reimbursement_approvals', ['approver_role'], {
      name: 'approvals_approver_role_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reimbursement_approvals');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reimbursement_approvals_approver_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reimbursement_approvals_decision";');
  },
};
