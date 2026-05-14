import dotenv from 'dotenv';
dotenv.config();

import { User, SystemOwner } from '../model';
import { encrypt, decrypt, generateBlindIndex } from '../utils/crypto';
import logger from '../utils/logger';
import sequelize from '../db';

/**
 * Utility script to migrate existing plain text PII data to encrypted format
 * and populate blind indexes for searching.
 */
async function migratePII() {
  logger.info('Starting PII Data Migration and Blind Indexing...');
  const transaction = await sequelize.transaction();

  try {
    // 1. Migrate Users
    const users = await User.findAll({ 
      transaction 
    }) as any[];
    
    let userCount = 0;
    for (const user of users) {
      let changed = false;
      const updateData: any = {};
      
      // Decrypt if already encrypted to ensure we have plain text for blind index
      const isEncrypted = (val: string | undefined) => {
        if (!val) return false;
        return val.split(':').length === 3;
      };

      const plainEmail = isEncrypted(user.email) ? decrypt(user.email) : user.email;

      if (plainEmail) {
        // Always update blind index to ensure consistency
        updateData.email_blind_index = generateBlindIndex(plainEmail);
        
        // Only encrypt if not already encrypted
        if (!isEncrypted(user.email)) {
          updateData.email = encrypt(plainEmail);
        }
        changed = true;
      }
      
      if (user.phone && !isEncrypted(user.phone)) {
        updateData.phone = encrypt(user.phone);
        changed = true;
      }
      
      if (user.student_identifier && !isEncrypted(user.student_identifier)) {
        updateData.student_identifier = encrypt(user.student_identifier);
        changed = true;
      }

      if (changed) {
        await User.update(updateData, { 
          where: { id: user.id }, 
          hooks: false, 
          transaction 
        });
        userCount++;
      }
    }
    logger.info(`Migrated/Updated ${userCount} users with encryption and blind indexes.`);

    // 2. Migrate SystemOwners
    const owners = await SystemOwner.findAll({ 
      transaction 
    }) as any[];
    
    let ownerCount = 0;
    for (const owner of owners) {
      let changed = false;
      const updateData: any = {};
      
      const isEncrypted = (val: string | undefined | null) => {
        if (!val) return false;
        return val.split(':').length === 3;
      };

      const plainEmail = isEncrypted(owner.email) ? decrypt(owner.email) : owner.email;

      if (plainEmail) {
        updateData.email_blind_index = generateBlindIndex(plainEmail);
        
        if (!isEncrypted(owner.email)) {
          updateData.email = encrypt(plainEmail);
        }
        changed = true;
      }
      
      if (owner.phone && !isEncrypted(owner.phone)) {
        updateData.phone = encrypt(owner.phone);
        changed = true;
      }

      if (changed) {
        await SystemOwner.update(updateData, { 
          where: { id: owner.id }, 
          hooks: false, 
          transaction 
        });
        ownerCount++;
      }
    }
    logger.info(`Migrated/Updated ${ownerCount} system owners with encryption and blind indexes.`);

    await transaction.commit();
    logger.info('PII Data Migration completed successfully.');
    process.exit(0);
  } catch (error: any) {
    await transaction.rollback();
    logger.error('PII Data Migration failed:', { error: error.message });
    process.exit(1);
  }
}

migratePII();
