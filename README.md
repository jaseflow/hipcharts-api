# Add column to table

```
SET @dbname = DATABASE();
SET @tablename = "chart";
SET @columnname = "cosigns";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD ", @columnname, " INT(11);")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
```

# Create Chart table
```
CREATE TABLE chart (
chart_id VARCHAR(100),
name VARCHAR(30),
query VARCHAR(50),
SUGGESTIONS VARCHAR(500),
PRIMARY KEY (chart_id));
```

# Create UserChart table
```
CREATE TABLE user_chart (
user_chart_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
items VARCHAR(200),
author VARCHAR(100),
cosigns INT DEFAULT 0,
chart_id VARCHAR(100),
PRIMARY KEY (user_chart_id));
```

# Create User table
```
CREATE TABLE user (
user_id VARCHAR(100),
PRIMARY KEY (user_id));
```
