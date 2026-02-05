const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Fetch all users
      // We use raw query to avoid model dependency issues in migration
      const users = await queryInterface.sequelize.query(
        'SELECT id, password FROM users',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      let updatedCount = 0;

      for (const user of users) {
        const { id, password } = user;
        
        // Skip if password is null/empty or looks like a bcrypt hash
        // Bcrypt hash format: $2[aby]$<cost>$<salt><hash>
        // Example: $2b$10$...
        if (!password) continue;
        
        const isBcrypt = /^\$2[aby]\$\d{2}\$.{53}$/.test(password);
        
        if (!isBcrypt) {
          // It's plain text (or some other format we treat as plain text for this migration)
          // Hash it with cost 12
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(password, salt);
          
          await queryInterface.sequelize.query(
            'UPDATE users SET password = :password WHERE id = :id',
            {
              replacements: { password: hashedPassword, id },
              type: Sequelize.QueryTypes.UPDATE,
              transaction
            }
          );
          updatedCount++;
        }
      }

      console.log(`Migration completed: Hashed ${updatedCount} plain-text passwords.`);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // We cannot revert hashing of passwords as it is a one-way function.
    console.warn('Irreversible migration: Cannot restore plain-text passwords.');
  }
};
