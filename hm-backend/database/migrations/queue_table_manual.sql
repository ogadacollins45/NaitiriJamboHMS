-- ============================================
-- Patient Queue Table Creation Script
-- Database: ChidstalHMS
-- Created: 2025-11-23
-- ============================================

CREATE TABLE IF NOT EXISTS `queue` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `patient_id` BIGINT UNSIGNED NOT NULL,
    `added_by` BIGINT UNSIGNED NULL,
    `status` ENUM('waiting', 'in_progress', 'completed', 'removed') NOT NULL DEFAULT 'waiting',
    `priority` INT NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `attended_at` TIMESTAMP NULL,
    `attended_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_status_priority_created` (`status`, `priority`, `created_at`),
    INDEX `idx_patient_id` (`patient_id`),
    CONSTRAINT `fk_queue_patient` 
        FOREIGN KEY (`patient_id`) 
        REFERENCES `patients` (`id`) 
        ON DELETE CASCADE,
    CONSTRAINT `fk_queue_added_by` 
        FOREIGN KEY (`added_by`) 
        REFERENCES `staff` (`id`) 
        ON DELETE SET NULL,
    CONSTRAINT `fk_queue_attended_by` 
        FOREIGN KEY (`attended_by`) 
        REFERENCES `staff` (`id`) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Verification Queries
-- ============================================

-- Check if table was created successfully
SHOW CREATE TABLE `queue`;

-- View table structure
DESCRIBE `queue`;

-- View indexes
SHOW INDEX FROM `queue`;
