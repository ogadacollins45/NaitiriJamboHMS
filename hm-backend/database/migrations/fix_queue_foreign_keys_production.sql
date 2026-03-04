-- ============================================
-- Fix Queue Table Foreign Keys for Production
-- Database: ChidstalHMS (Railway Production)
-- Purpose: Change foreign keys from 'users' to 'staff' table
-- ============================================

-- Step 1: Drop existing foreign key constraints that reference 'users' table
ALTER TABLE `queue` DROP FOREIGN KEY `fk_queue_added_by`;
ALTER TABLE `queue` DROP FOREIGN KEY `fk_queue_attended_by`;

-- Step 2: Add correct foreign key constraints that reference 'staff' table
ALTER TABLE `queue`
    ADD CONSTRAINT `fk_queue_added_by` 
        FOREIGN KEY (`added_by`) 
        REFERENCES `staff` (`id`) 
        ON DELETE SET NULL;

ALTER TABLE `queue`
    ADD CONSTRAINT `fk_queue_attended_by` 
        FOREIGN KEY (`attended_by`) 
        REFERENCES `staff` (`id`) 
        ON DELETE SET NULL;

-- Step 3: Verify the changes
SHOW CREATE TABLE `queue`;

-- ============================================
-- Instructions:
-- 1. Copy this entire SQL script
-- 2. Log into Railway dashboard
-- 3. Navigate to your database
-- 4. Execute this script
-- 5. Verify output shows foreign keys reference 'staff' table
-- ============================================
