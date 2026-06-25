'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_manager', {
      employee_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      manager_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    });

    // Composite primary key — each employee-manager pair is unique
    await queryInterface.addConstraint('employee_manager', {
      fields: ['employee_id', 'manager_id'],
      type: 'primary key',
      name: 'employee_manager_pkey',
    });

    await queryInterface.addIndex('employee_manager', ['manager_id'], {
      name: 'employee_manager_manager_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('employee_manager');
  },
};
