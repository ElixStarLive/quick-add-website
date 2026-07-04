-- QuickPost Ads – Job board database structure
-- Use with MySQL, PostgreSQL, or SQLite. Adjust types as needed.

-- Users (employers and job seekers; login with email + password)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs (employer posts; contact hidden until unlock; approved before publishing)
CREATE TABLE jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  salary VARCHAR(100),
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  is_featured TINYINT(1) DEFAULT 0,
  is_urgent TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payments: when a job seeker pays £5 to unlock contact (1 per job per payer)
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  job_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  payer_email VARCHAR(255) NOT NULL,
  payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_unlock_per_job_per_payer (job_id, payer_email),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Optional: job_seekers table if you want separate accounts for seekers
-- Optional: reported_jobs table for Report job button (job_id, reporter_email, reason, created_at)

-- Indexes
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created ON jobs(created_at);
CREATE INDEX idx_jobs_featured_urgent ON jobs(is_featured, is_urgent);
CREATE INDEX idx_payments_job_id ON payments(job_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
