-- 配方資料表建立 SQL

CREATE TABLE IF NOT EXISTS `recipe` (
  `snkey` INT(11) NOT NULL AUTO_INCREMENT COMMENT '主鍵',
  `recipeNumber` VARCHAR(50) NOT NULL COMMENT '配方編號',
  `datalist` TEXT NOT NULL COMMENT 'JSON格式資料',
  `updateTime` DATETIME DEFAULT NULL COMMENT '更新時間',
  PRIMARY KEY (`snkey`),
  UNIQUE KEY `idx_recipeNumber` (`recipeNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='配方資料表';
