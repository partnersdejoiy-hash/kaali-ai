-- KAALI custom tables
CREATE TABLE `wp_kaali_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_role` VARCHAR(30) NOT NULL,
  `prompt` LONGTEXT NOT NULL,
  `action_type` VARCHAR(80) NOT NULL,
  `status` VARCHAR(30) NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `action_type` (`action_type`),
  KEY `user_role` (`user_role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `wp_kaali_suggestions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `question_hash` VARCHAR(64) NOT NULL,
  `question_text` TEXT NOT NULL,
  `frequency` INT UNSIGNED NOT NULL DEFAULT 1,
  `suggestion` TEXT NULL,
  `last_seen` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_hash` (`question_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
