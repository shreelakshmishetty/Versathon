CREATE DATABASE IF NOT EXISTS h2_medical_reports;
USE h2_medical_reports;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    report_date DATE NULL,
    laboratory_name VARCHAR(255) NULL,
    extracted_text LONGTEXT NULL,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reports_user_id (user_id),
    INDEX idx_reports_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Test Results table
CREATE TABLE IF NOT EXISTS test_results (
    id INT NOT NULL AUTO_INCREMENT,
    report_id INT NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    value VARCHAR(255) NULL,
    unit VARCHAR(100) NULL,
    reference_range VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'unknown',
    explanation LONGTEXT NULL,
    important_note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    INDEX idx_test_results_report_id (report_id),
    INDEX idx_test_results_name (test_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comparisons table
CREATE TABLE IF NOT EXISTS comparisons (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    old_report_id INT NOT NULL,
    new_report_id INT NOT NULL,
    comparison_data LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (old_report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (new_report_id) REFERENCES reports(id) ON DELETE CASCADE,
    INDEX idx_comparisons_user_id (user_id),
    INDEX idx_comparisons_old_report (old_report_id),
    INDEX idx_comparisons_new_report (new_report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report Metadata / AI Notes table
CREATE TABLE IF NOT EXISTS report_metadata (
    id INT NOT NULL AUTO_INCREMENT,
    report_id INT NOT NULL,
    laboratory_name VARCHAR(255) NULL,
    raw_ocr_text LONGTEXT NULL,
    report_summary LONGTEXT NULL,
    general_notes LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    INDEX idx_report_metadata_report_id (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
