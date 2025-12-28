-- Добавление полей для маркеров блоков кода в таблицу tasks
ALTER TABLE tasks ADD COLUMN block_start_marker TEXT;
ALTER TABLE tasks ADD COLUMN block_end_marker TEXT;

