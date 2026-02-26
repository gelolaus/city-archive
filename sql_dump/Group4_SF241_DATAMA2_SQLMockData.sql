-- =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= --
-- JhunDB Professional Seeding Script
-- =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= --
USE city_archive_library_system;

-- 1. REAL CATEGORIES
INSERT INTO categories (category) VALUES 
('Philippine Literature'), ('World Classics'), ('Dystopian Fiction'), 
('Science & Tech'), ('Philosophy'), ('Modern Fiction');

-- 2. REAL AUTHORS (20)
INSERT INTO authors (first_name, last_name) VALUES 
('Jose', 'Rizal'), ('Nick', 'Joaquin'), ('F. Sionil', 'Jose'), -- PH
('George', 'Orwell'), ('Aldous', 'Huxley'), ('Ray', 'Bradbury'), -- Dystopian
('Fyodor', 'Dostoevsky'), ('Leo', 'Tolstoy'), ('Franz', 'Kafka'), -- Classics
('Gabriel Garcia', 'Marquez'), ('Haruki', 'Murakami'), ('Isabel', 'Allende'), -- Modern
('Albert', 'Camus'), ('Friedrich', 'Nietzsche'), ('Marcus', 'Aurelius'), -- Philosophy
('Stephen', 'Hawking'), ('Carl', 'Sagan'), ('Isaac', 'Asimov'), -- Science
('Toni', 'Morrison'), ('Virginia', 'Woolf'); -- Modern Classics

-- 3. REAL LIBRARIANS (5 Filipino Names)
CALL create_librarian('StaffPass@123!', 'Roberto', 'Dela Cruz');
CALL create_librarian('StaffPass@123!', 'Angelica', 'Santos');
CALL create_librarian('StaffPass@123!', 'Fernando', 'Manalo');
CALL create_librarian('StaffPass@123!', 'Carmela', 'Reyes');
CALL create_librarian('StaffPass@123!', 'Ricardo', 'Dalisay');

-- 4. REAL MEMBERS (50 Filipino Names)
DELIMITER $$
CREATE PROCEDURE seed_real_members()
BEGIN
    DECLARE i INT DEFAULT 1;
    -- Arrays for realistic name generation
    DECLARE first_names TEXT DEFAULT 'Juan,Maria,Jose,Elena,Pedro,Liza,Antonio,Rosa,Manuel,Teresa,Francis,Gloria,Benito,Pilar,Ramon,Sonia,Luis,Lourdes,Agustin,Clara,Gregorio,Rita,Dominador,Paz,Felipe,Lucia,Vicente,Esperanza,Tomas,Aurora,Jaime,Corazon,Eduardo,Imelda,Andres,Fe,Salvador,Perla,Rodolfo,Nenita,Enrique,Leonora,Teodoro,Estrella,Emilio,Flordeliza,Arsenio,Rosario,Patricio,Concepcion';
    DECLARE last_names TEXT DEFAULT 'Santos,Reyes,Cruz,Bautista,Ocampo,Garcia,Mendoza,Pascual,Castillo,Villanueva,Ramos,Luna,Aquino,Torres,Corpuz,Dela Rosa,Salazar,Mercado,Valdez,Pineda';

    WHILE i <= 50 DO
        CALL create_member(
            LPAD(HEX(i + 1000), 24, '0'),
            'Member@123!',
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(first_names, ',', i), ',', -1)),
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(last_names, ',', (i % 20) + 1), ',', -1)),
            CONCAT('user.', i, '@cityarchive.edu.ph'),
            CONCAT('0917', LPAD(i + 1000000, 7, '0'))
        );
        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;
CALL seed_real_members();
DROP PROCEDURE seed_real_members;

-- 5. REAL BOOKS (50 Titles)
DELIMITER $$
CREATE PROCEDURE seed_real_books()
BEGIN
    -- This procedure maps real titles to their correct Author/Category manually for the first few, then randomizes the rest.
    -- Philippine Literature
    CALL create_book(LPAD('B001', 24, '0'), 1, 1, 'Noli Me Tangere', '978-0143106364');
    CALL create_book(LPAD('B002', 24, '0'), 1, 1, 'El Filibusterismo', '978-0143106357');
    CALL create_book(LPAD('B003', 24, '0'), 2, 1, 'The Woman Who Had Two Navels', '978-9712733919');
    -- World Classics
    CALL create_book(LPAD('B004', 24, '0'), 7, 2, 'Crime and Punishment', '978-0143058144');
    CALL create_book(LPAD('B005', 24, '0'), 8, 2, 'War and Peace', '978-0199232765');
    CALL create_book(LPAD('B006', 24, '0'), 9, 2, 'The Metamorphosis', '978-0307949592');
    -- Dystopian
    CALL create_book(LPAD('B007', 24, '0'), 4, 3, '1984', '978-0451524935');
    CALL create_book(LPAD('B008', 24, '0'), 4, 3, 'Animal Farm', '978-0451526342');
    CALL create_book(LPAD('B009', 24, '0'), 5, 3, 'Brave New World', '978-0060850524');
    CALL create_book(LPAD('B010', 24, '0'), 6, 3, 'Fahrenheit 451', '978-1451673319');
    -- Philosophy
    CALL create_book(LPAD('B011', 24, '0'), 13, 5, 'The Stranger', '978-0679720201');
    CALL create_book(LPAD('B012', 24, '0'), 14, 5, 'Thus Spoke Zarathustra', '978-0140441185');
    CALL create_book(LPAD('B013', 24, '0'), 15, 5, 'Meditations', '978-0812968255');
    -- Science
    CALL create_book(LPAD('B014', 24, '0'), 16, 4, 'A Brief History of Time', '978-0553380163');
    CALL create_book(LPAD('B015', 24, '0'), 17, 4, 'Cosmos', '978-0345539434');
    CALL create_book(LPAD('B016', 24, '0'), 18, 4, 'Foundation', '978-0553293357');
    -- Modern
    CALL create_book(LPAD('B017', 24, '0'), 10, 6, 'One Hundred Years of Solitude', '978-0060883287');
    CALL create_book(LPAD('B018', 24, '0'), 11, 6, 'Norwegian Wood', '978-0375704970');
    CALL create_book(LPAD('B019', 24, '0'), 11, 6, 'Kafka on the Shore', '978-1400079278');
    CALL create_book(LPAD('B020', 24, '0'), 20, 6, 'To the Lighthouse', '978-0156907392');

    -- Seed remaining 30 books with generic but realistic sounding Archive titles
    BEGIN
        DECLARE j INT DEFAULT 21;
        WHILE j <= 50 DO
            CALL create_book(
                LPAD(HEX(j + 5000), 24, '0'),
                (FLOOR(1 + (RAND() * 19))),
                (FLOOR(1 + (RAND() * 6))),
                CONCAT('Historical Archive Collection Vol. ', j),
                CONCAT('ISB-', LPAD(j, 8, '0'), '-X')
            );
            SET j = j + 1;
        END WHILE;
    END;
END$$
DELIMITER ;
CALL seed_real_books();
DROP PROCEDURE seed_real_books;

-- 6. REALISTIC LOANS (100)
DELIMITER $$
CREATE PROCEDURE seed_realistic_loans()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE v_loan_id INT;
    DECLARE v_due DATE;
    WHILE i <= 100 DO
        INSERT INTO loans (member_id, book_id, librarian_id, checkout_date, due_date)
        VALUES (
            (FLOOR(1 + (RAND() * 49))),
            (FLOOR(1 + (RAND() * 49))),
            (FLOOR(1 + (RAND() * 4))),
            DATE_SUB(CURRENT_DATE, INTERVAL (FLOOR(RAND() * 20) + 10) DAY), -- Borrowed 10-30 days ago
            DATE_SUB(CURRENT_DATE, INTERVAL (FLOOR(RAND() * 5)) DAY)        -- Due 0-5 days ago (Mostly overdue)
        );
        SET v_loan_id = LAST_INSERT_ID();
        
        -- Make 40% of these "Returned Late" to test fine calculations
        IF i <= 40 THEN
            UPDATE loans SET return_date = CURRENT_DATE WHERE loan_id = v_loan_id;
            SET v_due = (SELECT due_date FROM loans WHERE loan_id = v_loan_id);
            INSERT INTO fines (loan_id, amount, is_paid) 
            VALUES (v_loan_id, calculate_fine(v_due, CURRENT_DATE), FALSE);
        END IF;
        
        -- Leave 30% as "Active but Overdue" (No return date)
        -- The rest are "Active and on-time" (We update their due dates to the future)
        IF i > 70 THEN
            UPDATE loans SET due_date = DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY) WHERE loan_id = v_loan_id;
        END IF;

        SET i = i + 1;
    END WHILE;
END$$
DELIMITER ;
CALL seed_realistic_loans();
DROP PROCEDURE seed_realistic_loans;