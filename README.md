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
CREATE TABLE CHART (
ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
NAME VARCHAR(30),
QUERY VARCHAR(50),
SUGGESTIONS VARCHAR(30))
```
