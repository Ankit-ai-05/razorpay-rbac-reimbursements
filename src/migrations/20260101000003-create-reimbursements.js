'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reimbursements', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: {
        type: Sequelize.DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      },
      amount: {
        type: Sequelize.DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      final_status: {
        type: Sequelize.DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('reimbursements', ['employee_id'], {
      name: 'reimbursements_employee_id_idx',
    });
    await queryInterface.addIndex('reimbursements', ['final_status'], {
      name: 'reimbursements_final_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reimbursements');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reimbursements_final_status";');
  },
};
