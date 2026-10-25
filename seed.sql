USE book_management;

-- 1. categories
INSERT INTO categories (name) VALUES
('Programming'),
('Database'),
('Computer Science');

-- 2. authors
INSERT INTO authors (name, email) VALUES
('Robert C. Martin', 'robert@example.com'),
('Thomas H. Cormen', 'cormen@example.com'),
('Andrew S. Tanenbaum', 'tanenbaum@example.com');

-- 3. members
INSERT INTO members (name, email, phone) VALUES
('Somchai Jaidee', 'somchai@example.com', '0811111111'),
('Somying Rakrian', 'somying@example.com', '0822222222'),
('Anan Dee', 'anan@example.com', '0833333333');

-- 4. books
INSERT INTO books
(title, isbn, published_year, total_copies, available_copies, author_id, category_id)
VALUES
('Clean Code', '9780132350884', 2008, 3, 3, 1, 1),
('Introduction to Algorithms', '9780262046305', 2022, 2, 2, 2, 3),
('Computer Networks', '9780132126953', 2010, 4, 4, 3, 3);

-- 5. borrowings
INSERT INTO borrowings
(member_id, book_id, borrowed_at, returned_at, status)
VALUES
(1, 1, '2026-08-20 10:00:00', NULL, 'BORROWED'),
(2, 2, '2026-08-21 13:30:00', NULL, 'BORROWED'),
(3, 3, '2026-08-22 09:15:00', '2026-08-23 10:00:00', 'RETURNED');