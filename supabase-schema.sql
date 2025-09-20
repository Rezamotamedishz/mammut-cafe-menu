-- Supabase Database Schema for Cafe Menu
-- Run this SQL in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    price INTEGER NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on products" ON products
    FOR SELECT USING (true);

-- Create policies for admin write access (you can modify this based on your auth needs)
CREATE POLICY "Allow all operations on categories" ON categories
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on products" ON products
    FOR ALL USING (true);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for product images
CREATE POLICY "Allow public read access on product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow public upload on product images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public update on product images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Allow public delete on product images" ON storage.objects
    FOR DELETE USING (bucket_id = 'product-images');

-- Insert default categories
INSERT INTO categories (name) VALUES 
    ('نوشیدنی‌های گرم'),
    ('نوشیدنی‌های سرد'),
    ('دسرها'),
    ('غذاهای سبک')
ON CONFLICT DO NOTHING;

-- Insert default products
INSERT INTO products (name, category_id, price, description) VALUES 
    ('اسپرسو', 1, 15000, 'قهوه اسپرسو خالص و قوی'),
    ('کاپوچینو', 1, 18000, 'اسپرسو با شیر بخارپز و فوم'),
    ('لاته', 1, 20000, 'اسپرسو با شیر داغ و فوم نرم'),
    ('آیس کافی', 2, 22000, 'قهوه سرد با یخ و شیر'),
    ('چیزکیک', 3, 25000, 'چیزکیک خانگی با توت فرنگی')
ON CONFLICT DO NOTHING;
