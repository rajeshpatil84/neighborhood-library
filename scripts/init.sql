-- ============================================================
-- Neighborhood Library – Database Schema
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- BOOKS
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    author      VARCHAR(255) NOT NULL,
    isbn        VARCHAR(20)  UNIQUE,
    genre       VARCHAR(100),
    total_copies INT         NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
    available_copies INT     NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    published_year INT,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT copies_lte_total CHECK (available_copies <= total_copies)
);

-- ============================================================
-- MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    phone       VARCHAR(30),
    address     TEXT,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BORROWINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS borrowings (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id         UUID        NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    member_id       UUID        NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    borrowed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    returned_at     TIMESTAMPTZ,
    fine_amount     NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    fine_paid       BOOLEAN     NOT NULL DEFAULT FALSE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_borrowings_book_id   ON borrowings(book_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_member_id ON borrowings(member_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_returned  ON borrowings(returned_at) WHERE returned_at IS NULL;

-- ============================================================
-- AUTO-UPDATE updated_at via trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_borrowings_updated_at
    BEFORE UPDATE ON borrowings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO books (title, author, isbn, genre, total_copies, available_copies, published_year, description) VALUES
  ('The Great Gatsby',        'F. Scott Fitzgerald', '9780743273565', 'Fiction',         3, 3, 1925, 'A story of wealth and longing in 1920s America.'),
  ('To Kill a Mockingbird',   'Harper Lee',          '9780061935466', 'Fiction',         2, 2, 1960, 'A coming-of-age story about racial injustice.'),
  ('1984',                    'George Orwell',       '9780451524935', 'Dystopian',       4, 4, 1949, 'A chilling vision of a totalitarian future.'),
  ('Sapiens',                 'Yuval Noah Harari',   '9780062316097', 'Non-Fiction',     2, 2, 2011, 'A brief history of humankind.'),
  ('The Alchemist',           'Paulo Coelho',        '9780062315007', 'Fiction',         3, 3, 1988, 'A philosophical novel about following your dreams.'),
  ('Dune',                    'Frank Herbert',       '9780441013593', 'Science Fiction', 2, 2, 1965, 'An epic science fiction masterpiece.'),
  ('The Hitchhiker''s Guide', 'Douglas Adams',       '9780345391803', 'Science Fiction', 3, 3, 1979, 'A comedic science fiction series.'),
  ('Atomic Habits',           'James Clear',         '9780735211292', 'Self-Help',       2, 2, 2018, 'Tiny changes, remarkable results.'),
  ('Clean Code',              'Robert C. Martin',    '9780132350884', 'Technology',      2, 2, 2008, 'A handbook of agile software craftsmanship.'),
  ('The Pragmatic Programmer','David Thomas',        '9780135957059', 'Technology',      2, 2, 1999, 'Your journey to mastery.')
ON CONFLICT DO NOTHING;

INSERT INTO members (name, email, phone, address) VALUES
  ('Alice Johnson', 'alice@example.com', '+1-555-0101', '123 Maple Street'),
  ('Bob Smith',     'bob@example.com',   '+1-555-0102', '456 Oak Avenue'),
  ('Carol White',   'carol@example.com', '+1-555-0103', '789 Pine Road')
ON CONFLICT DO NOTHING;
