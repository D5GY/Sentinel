CREATE TABLE `guilds` (
  `id` varchar(20) NOT NULL,
  `prefix` varchar(4) DEFAULT NULL,
  `mod_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`mod_roles`)),
  `admin_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`admin_roles`)),
  `member_joins_channel` varchar(20) DEFAULT NULL,
  `member_leaves_channel` varchar(20) DEFAULT NULL,
  `logs_channel` varchar(20) DEFAULT NULL,
  `auto_mod` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
