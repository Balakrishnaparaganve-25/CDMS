-- College Dashboard System - MySQL Database Schema
-- Run this script to initialize the database
-- Usage: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS college_db;
USE college_db;

-- ============================================================
-- USERS TABLE: stores login credentials and role information
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'exam_dept') NOT NULL DEFAULT 'student',
    email VARCHAR(150) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- STUDENTS TABLE: stores academic and personal details
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    dob DATE,
    gender ENUM('Male', 'Female', 'Other'),
    phone VARCHAR(15),
    address TEXT,
    department VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    academic_year VARCHAR(10),
    enrollment_date DATE,
    profile_photo_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SUBJECTS TABLE: master list of subjects
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_code VARCHAR(20) NOT NULL UNIQUE,
    subject_name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    credits INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- RESULTS TABLE: stores subject-wise marks and verification status
-- ============================================================
CREATE TABLE IF NOT EXISTS results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    academic_year VARCHAR(10) NOT NULL,
    internal_marks DECIMAL(5,2) DEFAULT 0,
    external_marks DECIMAL(5,2) DEFAULT 0,
    total_marks DECIMAL(5,2) GENERATED ALWAYS AS (internal_marks + external_marks) STORED,
    max_internal INT DEFAULT 50,
    max_external INT DEFAULT 50,
    grade VARCHAR(5),
    status ENUM('pending', 'verified', 'published') NOT NULL DEFAULT 'pending',
    entered_by INT,
    verified_by INT,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_result (student_id, subject_id, semester, academic_year)
);

-- ============================================================
-- NOTIFICATIONS TABLE: announcements for students
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'urgent') DEFAULT 'info',
    target_role ENUM('all', 'student', 'admin', 'exam_dept') DEFAULT 'all',
    target_department VARCHAR(100) DEFAULT NULL,
    target_semester INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- NOTIFICATION_READS TABLE: tracks which notifications a user has read
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_read (notification_id, user_id)
);

-- ============================================================
-- AUDIT_LOGS TABLE: tracks important system actions
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA: Default admin and exam dept accounts
-- Both passwords are bcrypt hash of 'Admin@123'
-- ============================================================
INSERT INTO users (username, password_hash, role, email) VALUES
('admin',    '$2b$12$KIXEgHNiJSz2WCNqlJ4oTeA2bK7.xqXVJpU7VtfFCH1pJq9CfDmXe', 'admin',     'admin@college.edu'),
('examdept', '$2b$12$KIXEgHNiJSz2WCNqlJ4oTeA2bK7.xqXVJpU7VtfFCH1pJq9CfDmXe', 'exam_dept', 'examdept@college.edu');

-- ============================================================
-- SEED DATA: Sample subjects
-- ============================================================
INSERT INTO subjects (subject_code, subject_name, department, semester, credits) VALUES
('CS101', 'Introduction to Programming',  'Computer Science', 1, 4),
('CS102', 'Mathematics for Computing',    'Computer Science', 1, 3),
('CS103', 'Digital Electronics',          'Computer Science', 1, 3),
('CS201', 'Data Structures',              'Computer Science', 2, 4),
('CS202', 'Database Management Systems',  'Computer Science', 2, 4),
('CS203', 'Computer Networks',            'Computer Science', 2, 3),
('EC101', 'Basic Electronics',            'Electronics',      1, 4),
('EC102', 'Circuit Theory',               'Electronics',      1, 3),
('ME101', 'Engineering Mechanics',        'Mechanical',       1, 4),
('ME102', 'Engineering Drawing',          'Mechanical',       1, 3);

-- ============================================================
-- SEED DATA: Sample notifications
-- ============================================================
INSERT INTO notifications (title, message, type, target_role, created_by) VALUES
('Welcome to College Dashboard', 'The new College Dashboard System is now live. Please update your profile information.', 'info', 'all', 1),
('Semester Exams Schedule Released', 'The examination schedule for the upcoming semester has been published. Check the notice board.', 'urgent', 'student', 1),
('Result Verification Pending', 'Please verify and publish the pending semester results at the earliest.', 'warning', 'exam_dept', 1);

