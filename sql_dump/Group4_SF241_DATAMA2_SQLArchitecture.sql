-- =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= --
-- JhunDB Database Solutions
-- Client: City Archive Library
-- =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= --

DROP DATABASE IF EXISTS city_archive_library_system;
CREATE DATABASE city_archive_library_system;
USE city_archive_library_system;

-- ==========================================
-- 1. CORE TABLES & POLYGLOT HOOKS 
-- ==========================================

CREATE TABLE authors(
    author_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    category_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE members(
    member_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mongo_id CHAR(24) UNIQUE, 
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_member_email CHECK (email LIKE '%_@__%.__%'),
    CONSTRAINT chk_member_phone CHECK (phone_number REGEXP '^[0-9\-\+]+$' AND CHAR_LENGTH(phone_number) >= 11),
    CONSTRAINT chk_member_password CHECK (
        REGEXP_LIKE(password, '[A-Z]', 'c') AND 
        REGEXP_LIKE(password, '[a-z]', 'c') AND 
        REGEXP_LIKE(password, '[0-9]', 'c') AND 
        REGEXP_LIKE(password, '[^a-zA-Z0-9]', 'c')
    )
);

CREATE TABLE librarians(
    librarian_id SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_librarian_email CHECK (email LIKE '%_@__%.__%'),
    CONSTRAINT chk_librarian_password CHECK (
        REGEXP_LIKE(password, '[A-Z]', 'c') AND 
        REGEXP_LIKE(password, '[a-z]', 'c') AND 
        REGEXP_LIKE(password, '[0-9]', 'c') AND 
        REGEXP_LIKE(password, '[^a-zA-Z0-9]', 'c')
    )
);

CREATE TABLE books(
    book_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mongo_id CHAR(24) UNIQUE, 
    author_id INT UNSIGNED NOT NULL,
    category_id SMALLINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
);

CREATE TABLE loans(
    loan_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    member_id INT UNSIGNED NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    librarian_id SMALLINT UNSIGNED NOT NULL,
    checkout_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    due_date DATE NOT NULL,
    return_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE RESTRICT,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE RESTRICT,
    FOREIGN KEY (librarian_id) REFERENCES librarians(librarian_id) ON DELETE RESTRICT
);

CREATE TABLE fines(
    fine_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    loan_id INT UNSIGNED NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(loan_id) ON DELETE CASCADE
);

-- ==========================================
-- 2. DEDICATED ARCHIVE TABLES (The Vault)
-- ==========================================

CREATE TABLE authors_archive (
    archive_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
    original_id INT UNSIGNED, 
    record_payload JSON, 
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books_archive (
    archive_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
    original_id INT UNSIGNED, 
    record_payload JSON, 
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. INDEX OPTIMIZATION 
-- ==========================================
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_username ON members(username);
CREATE INDEX idx_librarians_username ON librarians(username);
CREATE INDEX idx_loans_active ON loans(member_id, return_date);

-- ==========================================
-- 4. FUNCTIONS: BUSINESS LOGIC
-- ==========================================
DELIMITER $$

CREATE FUNCTION extract_initials(str VARCHAR(255)) RETURNS VARCHAR(50) DETERMINISTIC
BEGIN
    DECLARE result VARCHAR(50) DEFAULT ''; DECLARE i INT DEFAULT 1; DECLARE len INT; DECLARE is_space BOOLEAN DEFAULT TRUE; DECLARE c CHAR(1);
    SET str = TRIM(str); SET len = CHAR_LENGTH(str);
    WHILE i <= len DO
        SET c = SUBSTRING(str, i, 1);
        IF c = ' ' THEN SET is_space = TRUE;
        ELSEIF is_space = TRUE AND c != ' ' THEN SET result = CONCAT(result, c); SET is_space = FALSE; END IF;
        SET i = i + 1;
    END WHILE;
    RETURN LOWER(result);
END$$

CREATE FUNCTION calculate_fine(p_due_date DATE, p_return_date DATE) RETURNS DECIMAL(10,2) DETERMINISTIC
BEGIN
    IF p_return_date <= p_due_date THEN RETURN 0.00; END IF;
    RETURN DATEDIFF(p_return_date, p_due_date) * 20.00;
END$$

CREATE FUNCTION is_book_available(p_book_id INT) RETURNS BOOLEAN READS SQL DATA
BEGIN
    DECLARE v_is_borrowed INT;
    SELECT COUNT(*) INTO v_is_borrowed FROM loans WHERE book_id = p_book_id AND return_date IS NULL;
    IF v_is_borrowed > 0 THEN RETURN FALSE; ELSE RETURN TRUE; END IF;
END$$

CREATE FUNCTION get_member_total_fines(p_member_id INT) RETURNS DECIMAL(10,2) READS SQL DATA
BEGIN
    DECLARE v_total DECIMAL(10,2) DEFAULT 0.00;
    SELECT COALESCE(SUM(f.amount), 0.00) INTO v_total
    FROM fines f JOIN loans l ON f.loan_id = l.loan_id
    WHERE l.member_id = p_member_id AND f.is_paid = TRUE;
    RETURN v_total;
END$$

DELIMITER ;

-- ==========================================
-- 5. ALGORITHMIC TRIGGERS
-- ==========================================
DELIMITER $$

CREATE TRIGGER trg_members_username BEFORE INSERT ON members FOR EACH ROW
BEGIN
    DECLARE v_base VARCHAR(100); DECLARE v_final VARCHAR(100); DECLARE v_counter INT DEFAULT 2; DECLARE v_exists INT DEFAULT 0;
    SET v_base = LOWER(CONCAT(extract_initials(NEW.first_name), REPLACE(NEW.last_name, ' ', '')));
    SET v_final = v_base;
    SELECT COUNT(*) INTO v_exists FROM members WHERE username = v_final;
    WHILE v_exists > 0 DO
        SET v_final = CONCAT(v_base, v_counter); SET v_counter = v_counter + 1;
        SELECT COUNT(*) INTO v_exists FROM members WHERE username = v_final;
    END WHILE;
    SET NEW.username = v_final;
END$$

CREATE TRIGGER trg_librarians_auth BEFORE INSERT ON librarians FOR EACH ROW
BEGIN
    DECLARE v_base VARCHAR(100); DECLARE v_final VARCHAR(100); DECLARE v_counter INT DEFAULT 2; DECLARE v_exists INT DEFAULT 0;
    SET v_base = LOWER(CONCAT(SUBSTRING_INDEX(NEW.first_name, ' ', 1), SUBSTRING(NEW.last_name, 1, 1)));
    SET v_final = v_base;
    SELECT COUNT(*) INTO v_exists FROM librarians WHERE username = v_final;
    WHILE v_exists > 0 DO
        SET v_final = CONCAT(v_base, v_counter); SET v_counter = v_counter + 1;
        SELECT COUNT(*) INTO v_exists FROM librarians WHERE username = v_final;
    END WHILE;
    SET NEW.username = v_final;
    SET NEW.email = CONCAT(v_final, '@city-archive.vercel.app');
END$$

CREATE TRIGGER trg_limit_active_loans BEFORE INSERT ON loans FOR EACH ROW
BEGIN
    DECLARE active_loans INT;
    SELECT COUNT(*) INTO active_loans FROM loans WHERE member_id = NEW.member_id AND return_date IS NULL;
    IF active_loans >= 5 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Policy Violation: Maximum of 5 active loans reached.'; END IF;
END$$

-- The Vault: Archive Triggers
CREATE TRIGGER trg_arc_authors BEFORE DELETE ON authors FOR EACH ROW
BEGIN
	INSERT INTO authors_archive (original_id, record_payload)
    VALUES (OLD.author_id, JSON_OBJECT('first_name', OLD.first_name, 'last_name', OLD.last_name));
END$$

CREATE TRIGGER trg_arc_books BEFORE DELETE ON books FOR EACH ROW
BEGIN
	INSERT INTO books_archive (original_id, record_payload)
    VALUES (OLD.book_id, JSON_OBJECT('mongo_id', OLD.mongo_id, 'author_id', OLD.author_id, 'category_id', OLD.category_id, 'title', OLD.title, 'isbn', OLD.isbn));
END$$

DELIMITER ;

-- ==========================================
-- 6. ACID COMPLIANT PROCEDURES
-- ==========================================
DELIMITER $$

-- CREATE PROCEDURES
CREATE PROCEDURE create_member(IN p_mongo_id CHAR(24), IN p_password VARCHAR(255), IN p_first VARCHAR(50), IN p_last VARCHAR(50), IN p_email VARCHAR(100), IN p_phone VARCHAR(15))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    INSERT INTO members (mongo_id, username, password, first_name, last_name, email, phone_number) 
    VALUES (p_mongo_id, 'PENDING', p_password, TRIM(p_first), TRIM(p_last), TRIM(p_email), TRIM(p_phone));
    COMMIT;
END$$

CREATE PROCEDURE create_librarian(IN p_password VARCHAR(255), IN p_first VARCHAR(50), IN p_last VARCHAR(50))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    INSERT INTO librarians (username, password, first_name, last_name, email) 
    VALUES ('PENDING', p_password, TRIM(p_first), TRIM(p_last), 'PENDING@city-archive.vercel.app');
    COMMIT;
END$$

CREATE PROCEDURE create_book(IN p_mongo_id CHAR(24), IN p_author_id INT, IN p_category_id SMALLINT, IN p_title VARCHAR(255), IN p_isbn VARCHAR(20))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    INSERT INTO books (mongo_id, author_id, category_id, title, isbn) VALUES (p_mongo_id, p_author_id, p_category_id, TRIM(p_title), TRIM(p_isbn));
    SELECT LAST_INSERT_ID() AS new_book_id;
    COMMIT;
END$$

-- UPDATE PROCEDURES
CREATE PROCEDURE update_book(IN p_book_id INT, IN p_author_id INT, IN p_category_id SMALLINT, IN p_title VARCHAR(255), IN p_isbn VARCHAR(20))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    UPDATE books SET author_id = p_author_id, category_id = p_category_id, title = TRIM(p_title), isbn = TRIM(p_isbn) WHERE book_id = p_book_id;
    COMMIT;
END$$

CREATE PROCEDURE update_author(IN p_author_id INT, IN p_first_name VARCHAR(50), IN p_last_name VARCHAR(50))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    UPDATE authors SET first_name = TRIM(p_first_name), last_name = TRIM(p_last_name) WHERE author_id = p_author_id;
    COMMIT;
END$$

CREATE PROCEDURE update_member(IN p_member_id INT, IN p_first_name VARCHAR(50), IN p_last_name VARCHAR(50), IN p_email VARCHAR(100), IN p_phone VARCHAR(15), IN p_password VARCHAR(255))
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    UPDATE members SET first_name = TRIM(p_first_name), last_name = TRIM(p_last_name), email = LOWER(TRIM(p_email)), phone_number = TRIM(p_phone), password = COALESCE(p_password, password) WHERE member_id = p_member_id;
    COMMIT;
END$$

-- RESTORE PROCEDURES
CREATE PROCEDURE restore_book(IN p_archive_id INT)
BEGIN
    DECLARE v_original_id INT; DECLARE v_payload JSON;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT original_id, record_payload INTO v_original_id, v_payload FROM books_archive WHERE archive_id = p_archive_id;
    INSERT INTO books (book_id, mongo_id, author_id, category_id, title, isbn)
    VALUES (v_original_id, v_payload->>'$.mongo_id', CAST(v_payload->>'$.author_id' AS UNSIGNED), CAST(v_payload->>'$.category_id' AS UNSIGNED), v_payload->>'$.title', v_payload->>'$.isbn');
    DELETE FROM books_archive WHERE archive_id = p_archive_id;
    COMMIT;
END$$

CREATE PROCEDURE restore_author(IN p_archive_id INT)
BEGIN
    DECLARE v_original_id INT; DECLARE v_payload JSON;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT original_id, record_payload INTO v_original_id, v_payload FROM authors_archive WHERE archive_id = p_archive_id;
    INSERT INTO authors (author_id, first_name, last_name) VALUES (v_original_id, v_payload->>'$.first_name', v_payload->>'$.last_name');
    DELETE FROM authors_archive WHERE archive_id = p_archive_id;
    COMMIT;
END$$

-- SEARCH & AUTH
CREATE PROCEDURE search_books(IN p_keyword VARCHAR(100), IN p_type VARCHAR(20), IN p_status VARCHAR(20))
BEGIN
    SELECT b.book_id, b.title, b.isbn, c.category, CONCAT(a.first_name, ' ', a.last_name) AS author, is_book_available(b.book_id) AS available
    FROM books b JOIN authors a ON b.author_id = a.author_id JOIN categories c ON b.category_id = c.category_id
    WHERE (p_keyword = '' OR (p_type = 'all' AND (b.title LIKE CONCAT('%', p_keyword, '%') OR a.last_name LIKE CONCAT('%', p_keyword, '%') OR b.isbn LIKE CONCAT('%', p_keyword, '%'))) OR (p_type = 'title' AND b.title LIKE CONCAT('%', p_keyword, '%')) OR (p_type = 'author' AND (a.first_name LIKE CONCAT('%', p_keyword, '%') OR a.last_name LIKE CONCAT('%', p_keyword, '%'))))
    AND (p_status = 'all' OR (p_status = 'available' AND is_book_available(b.book_id) = TRUE) OR (p_status = 'borrowed' AND is_book_available(b.book_id) = FALSE));
END$$

CREATE PROCEDURE search_members(IN p_keyword VARCHAR(100))
BEGIN
    SELECT member_id, username, CONCAT(first_name, ' ', last_name) AS full_name, email, is_active, phone_number FROM members
    WHERE username LIKE CONCAT('%', p_keyword, '%') OR last_name LIKE CONCAT('%', p_keyword, '%') OR first_name LIKE CONCAT('%', p_keyword, '%') OR CONCAT(first_name, ' ', last_name) LIKE CONCAT('%', p_keyword, '%') OR email LIKE CONCAT('%', p_keyword, '%');
END$$

CREATE PROCEDURE get_member_auth(IN p_identifier VARCHAR(100))
BEGIN
    SELECT member_id, username, email, password, is_active FROM members WHERE username = p_identifier OR email = p_identifier LIMIT 1;
END$$

CREATE PROCEDURE get_librarian_auth(IN p_identifier VARCHAR(100))
BEGIN
    SELECT librarian_id, username, email, password, is_active FROM librarians WHERE username = p_identifier OR email = p_identifier LIMIT 1;
END$$

-- TRANSACTIONS
CREATE PROCEDURE process_borrow(IN p_member_id INT, IN p_book_id INT, IN p_librarian_id INT)
BEGIN
    DECLARE v_is_active BOOLEAN; DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT is_active INTO v_is_active FROM members WHERE member_id = p_member_id FOR UPDATE;
    IF v_is_active = FALSE THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Security Violation: Member account is currently suspended.'; END IF;
    INSERT INTO loans (member_id, book_id, librarian_id, checkout_date, due_date) VALUES (p_member_id, p_book_id, p_librarian_id, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY));
    COMMIT;
END$$

CREATE PROCEDURE process_return(IN p_loan_id INT)
BEGIN
    DECLARE v_due_date DATE; DECLARE v_fine DECIMAL(10,2); DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    SELECT due_date INTO v_due_date FROM loans WHERE loan_id = p_loan_id AND return_date IS NULL FOR UPDATE;
    IF v_due_date IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Loan ID not active or invalid.'; END IF;
    UPDATE loans SET return_date = CURRENT_DATE WHERE loan_id = p_loan_id;
    SET v_fine = calculate_fine(v_due_date, CURRENT_DATE);
    IF v_fine > 0 THEN INSERT INTO fines (loan_id, amount, is_paid) VALUES (p_loan_id, v_fine, FALSE); END IF;
    COMMIT;
END$$

CREATE PROCEDURE process_fine_payment(IN p_fine_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    UPDATE fines SET is_paid = TRUE WHERE fine_id = p_fine_id;
    COMMIT;
END$$

-- DELETE PROCEDURES
CREATE PROCEDURE delete_book(IN p_book_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;
    START TRANSACTION;
    DELETE FROM books WHERE book_id = p_book_id;
    COMMIT;
END$$

-- DASHBOARD VIEWS
CREATE PROCEDURE get_member_overdue_books(IN p_member_id INT) BEGIN SELECT l.loan_id as id, b.title, DATE_FORMAT(l.due_date, '%Y-%m-%d') as dueDate, calculate_fine(l.due_date, CURRENT_DATE) as fine FROM loans l JOIN books b ON l.book_id = b.book_id WHERE l.member_id = p_member_id AND l.return_date IS NULL AND l.due_date < CURRENT_DATE; END$$
CREATE PROCEDURE get_member_current_loans(IN p_member_id INT) BEGIN SELECT l.loan_id as id, b.title, DATE_FORMAT(l.due_date, '%Y-%m-%d') as dueDate, CASE WHEN l.due_date < CURRENT_DATE THEN 'Overdue' ELSE 'Active' END as status FROM loans l JOIN books b ON l.book_id = b.book_id WHERE l.member_id = p_member_id AND l.return_date IS NULL; END$$
CREATE PROCEDURE get_member_history(IN p_member_id INT, IN p_filter VARCHAR(10)) BEGIN SELECT l.loan_id as id, b.title, DATE_FORMAT(l.return_date, '%Y-%m-%d') as returnedOn FROM loans l JOIN books b ON l.book_id = b.book_id WHERE l.member_id = p_member_id AND l.return_date IS NOT NULL AND (p_filter = 'all' OR (p_filter = '1m' AND l.return_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)) OR (p_filter = '3m' AND l.return_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)) OR (p_filter = '9m' AND l.return_date >= DATE_SUB(CURRENT_DATE, INTERVAL 9 MONTH)) OR (p_filter = '1y' AND l.return_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR))) ORDER BY l.return_date DESC; END$$

DELIMITER ;

-- ==========================================
-- 7. EVENTS & SEEDING
-- ==========================================
SET GLOBAL event_scheduler = ON;
DELIMITER $$
CREATE EVENT IF NOT EXISTS purge_30_day_archives ON SCHEDULE EVERY 1 DAY DO BEGIN
    DELETE FROM books_archive WHERE archived_at < NOW() - INTERVAL 30 DAY;
    DELETE FROM authors_archive WHERE archived_at < NOW() - INTERVAL 30 DAY;
END$$
DELIMITER ;

INSERT INTO categories (category) VALUES ('Fantasy'), ('Fiction'), ('Non-Fiction'), ('Science'), ('History');
INSERT INTO authors (first_name, last_name) VALUES ('Jose', 'Rizal'), ('J.K.', 'Rowling'), ('George', 'Orwell');
CALL create_librarian('Libro@2026!', 'Jane', 'Libro'); 

-- ==========================================
-- 8. VIEWS
-- ==========================================
CREATE VIEW vw_catalog_books AS
SELECT
    b.book_id,
    b.title,
    b.isbn,
    c.category AS category,
    CONCAT(a.first_name, ' ', a.last_name) AS author,
    is_book_available(b.book_id) AS available
FROM books b
JOIN authors   a ON b.author_id   = a.author_id
JOIN categories c ON b.category_id = c.category_id;

CREATE VIEW vw_archived_books AS
SELECT
    ba.archive_id,
    ba.original_id,
    ba.record_payload,
    DATE_FORMAT(ba.archived_at, '%Y-%m-%d %H:%i') AS archived_date,
    DATE_FORMAT(DATE_ADD(ba.archived_at, INTERVAL 30 DAY), '%Y-%m-%d') AS deletion_date
FROM books_archive ba;

CREATE VIEW vw_authors_directory AS
SELECT
    a.author_id,
    a.first_name,
    a.last_name,
    a.created_at
FROM authors a;

CREATE VIEW vw_archived_authors AS
SELECT
    aa.archive_id,
    aa.original_id,
    aa.record_payload,
    DATE_FORMAT(aa.archived_at, '%Y-%m-%d %H:%i') AS archived_date,
    DATE_FORMAT(DATE_ADD(aa.archived_at, INTERVAL 30 DAY), '%Y-%m-%d') AS deletion_date
FROM authors_archive aa;

CREATE VIEW vw_member_directory AS
SELECT
    m.member_id,
    m.username,
    m.first_name,
    m.last_name,
    m.email,
    m.phone_number,
    m.is_active,
    m.created_at
FROM members m;

CREATE VIEW vw_active_loans AS
SELECT
    l.loan_id,
    l.member_id,
    l.book_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    b.title,
    DATE_FORMAT(l.due_date, '%Y-%m-%d') AS due_date,
    l.checkout_date,
    l.return_date
FROM loans l
JOIN members m ON l.member_id = m.member_id
JOIN books   b ON l.book_id   = b.book_id
WHERE l.return_date IS NULL;

CREATE VIEW vw_unpaid_fines AS
SELECT
    f.fine_id,
    f.amount,
    DATE_FORMAT(f.created_at, '%Y-%m-%d') AS issued_date,
    l.loan_id,
    b.title,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    m.member_id
FROM fines f
JOIN loans   l ON f.loan_id = l.loan_id
JOIN books   b ON l.book_id = b.book_id
JOIN members m ON l.member_id = m.member_id
WHERE f.is_paid = FALSE;

CREATE VIEW vw_category_distribution AS
SELECT
    c.category_id,
    c.category AS name,
    COUNT(b.book_id) AS value
FROM books b
JOIN categories c ON b.category_id = c.category_id
GROUP BY c.category_id, c.category;

-- ==========================================
-- 9. DATA CONTROL LANGUAGE (RBAC)
-- ==========================================
DROP ROLE IF EXISTS 'ca_admin_role', 'ca_member_role', 'ca_operations_role';
CREATE ROLE 'ca_admin_role', 'ca_member_role', 'ca_operations_role';

-- Member Grants
GRANT SELECT ON city_archive_library_system.books TO 'ca_member_role';
GRANT SELECT ON city_archive_library_system.authors TO 'ca_member_role';
GRANT SELECT ON city_archive_library_system.categories TO 'ca_member_role';
GRANT EXECUTE ON FUNCTION city_archive_library_system.is_book_available TO 'ca_member_role';
GRANT EXECUTE ON FUNCTION city_archive_library_system.get_member_total_fines TO 'ca_member_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.get_member_overdue_books TO 'ca_member_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.get_member_current_loans TO 'ca_member_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.get_member_history TO 'ca_member_role';

-- Admin Full Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON city_archive_library_system.* TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.create_member TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.create_book TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.create_librarian TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.update_book TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.update_author TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.update_member TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.restore_book TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.restore_author TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.search_books TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.search_members TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.process_borrow TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.process_return TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.process_fine_payment TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.delete_book TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.get_member_auth TO 'ca_admin_role';
GRANT EXECUTE ON PROCEDURE city_archive_library_system.get_librarian_auth TO 'ca_admin_role';

-- Operations Grants
GRANT SELECT, UPDATE ON city_archive_library_system.loans TO 'ca_operations_role';
GRANT SELECT, INSERT, UPDATE ON city_archive_library_system.fines TO 'ca_operations_role';