-- Seed data for categories and products

-- Insert Categories
INSERT INTO categories (name, description, image_url, display_order, is_active) VALUES
('Vegetables', 'Fresh, locally-grown vegetables', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800', 1, true),
('Fruits', 'Seasonal fruits from local farms', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800', 2, true),
('Dairy & Eggs', 'Farm-fresh dairy products and eggs', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800', 3, true),
('Meat & Poultry', 'Locally-raised meat and poultry', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800', 4, true),
('Baked Goods', 'Fresh bread and baked items', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', 5, true),
('Honey & Preserves', 'Local honey, jams, and preserves', 'https://images.unsplash.com/photo-1587049352846-4a222e784587?w=800', 6, true);

-- Get category IDs for reference
DO $$
DECLARE
    vegetables_id UUID;
    fruits_id UUID;
    dairy_id UUID;
    meat_id UUID;
    baked_id UUID;
    honey_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO vegetables_id FROM categories WHERE name = 'Vegetables';
    SELECT id INTO fruits_id FROM categories WHERE name = 'Fruits';
    SELECT id INTO dairy_id FROM categories WHERE name = 'Dairy & Eggs';
    SELECT id INTO meat_id FROM categories WHERE name = 'Meat & Poultry';
    SELECT id INTO baked_id FROM categories WHERE name = 'Baked Goods';
    SELECT id INTO honey_id FROM categories WHERE name = 'Honey & Preserves';

    -- Insert Vegetables
    INSERT INTO products (category_id, name, description, price, unit, image_url, stock_quantity, is_available, farm_name, farm_location, is_organic) VALUES
    (vegetables_id, 'Organic Tomatoes', 'Vine-ripened heirloom tomatoes', 4.99, 'lb', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800', 50, true, 'Green Valley Farm', 'Vermont', true),
    (vegetables_id, 'Fresh Lettuce', 'Crisp romaine lettuce', 3.49, 'head', 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800', 40, true, 'Sunny Acres', 'Vermont', true),
    (vegetables_id, 'Baby Carrots', 'Sweet baby carrots', 2.99, 'lb', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800', 60, true, 'Harvest Moon Farm', 'Vermont', false),
    (vegetables_id, 'Bell Peppers', 'Mixed color bell peppers', 5.49, 'lb', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800', 35, true, 'Green Valley Farm', 'Vermont', true),
    (vegetables_id, 'Broccoli', 'Fresh broccoli crowns', 3.99, 'lb', 'https://images.unsplash.com/photo-1628773822990-202f1c6d0e43?w=800', 45, true, 'Sunny Acres', 'Vermont', true),
    (vegetables_id, 'Spinach', 'Baby spinach leaves', 4.49, 'lb', 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800', 30, true, 'Green Valley Farm', 'Vermont', true),
    (vegetables_id, 'Zucchini', 'Fresh green zucchini', 2.49, 'lb', 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=800', 40, true, 'Harvest Moon Farm', 'Vermont', false),
    (vegetables_id, 'Cucumbers', 'Crisp cucumbers', 1.99, 'each', 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=800', 50, true, 'Sunny Acres', 'Vermont', false);

    -- Insert Fruits
    INSERT INTO products (category_id, name, description, price, unit, image_url, stock_quantity, is_available, farm_name, farm_location, is_organic) VALUES
    (fruits_id, 'Honeycrisp Apples', 'Sweet and crispy apples', 5.99, 'lb', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800', 80, true, 'Orchard Hills', 'Vermont', true),
    (fruits_id, 'Fresh Strawberries', 'Sweet local strawberries', 6.99, 'pint', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800', 25, true, 'Berry Patch Farm', 'Vermont', true),
    (fruits_id, 'Blueberries', 'Plump fresh blueberries', 7.49, 'pint', 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800', 30, true, 'Berry Patch Farm', 'Vermont', true),
    (fruits_id, 'Peaches', 'Juicy ripe peaches', 4.99, 'lb', 'https://images.unsplash.com/photo-1629828874514-d5e3b3f6f1f4?w=800', 40, true, 'Orchard Hills', 'Vermont', false),
    (fruits_id, 'Pears', 'Sweet Bartlett pears', 4.49, 'lb', 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800', 35, true, 'Orchard Hills', 'Vermont', false),
    (fruits_id, 'Raspberries', 'Fresh red raspberries', 8.99, 'pint', 'https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?w=800', 20, true, 'Berry Patch Farm', 'Vermont', true);

    -- Insert Dairy & Eggs
    INSERT INTO products (category_id, name, description, price, unit, image_url, stock_quantity, is_available, farm_name, farm_location, is_organic) VALUES
    (dairy_id, 'Farm Fresh Eggs', 'Free-range chicken eggs', 6.99, 'dozen', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800', 100, true, 'Happy Hen Farm', 'Vermont', true),
    (dairy_id, 'Whole Milk', 'Fresh whole milk', 5.49, 'gallon', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800', 50, true, 'Dairy Dale Farm', 'Vermont', false),
    (dairy_id, 'Cheddar Cheese', 'Aged Vermont cheddar', 12.99, 'lb', 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800', 30, true, 'Dairy Dale Farm', 'Vermont', false),
    (dairy_id, 'Greek Yogurt', 'Creamy Greek yogurt', 4.99, 'pint', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800', 40, true, 'Dairy Dale Farm', 'Vermont', true),
    (dairy_id, 'Butter', 'Grass-fed butter', 7.99, 'lb', 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800', 35, true, 'Dairy Dale Farm', 'Vermont', true);

    -- Insert Meat & Poultry
    INSERT INTO products (category_id, name, description, price, unit, image_url, stock_quantity, is_available, farm_name, farm_location, is_organic) VALUES
    (meat_id, 'Ground Beef', 'Grass-fed ground beef', 9.99, 'lb', 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800', 40, true, 'Meadow Ranch', 'Vermont', true),
    (meat_id, 'Chicken Breast', 'Free-range chicken breast', 11.99, 'lb', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800', 35, true, 'Happy Hen Farm', 'Vermont', true),
    (meat_id, 'Pork Chops', 'Heritage pork chops', 10.99, 'lb', 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=800', 25, true, 'Meadow Ranch', 'Vermont', false),
    (meat_id, 'Bacon', 'Thick-cut bacon', 12.99, 'lb', 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800', 30, true, 'Meadow Ranch', 'Vermont', false);

    -- Insert Baked Goods
    INSERT INTO products (category_id, name, description, price, unit, image_url, stock_quantity, is_available, farm_name, farm_location, is_organic) VALUES
    (baked_id, 'Sourdough Bread', 'Artisan sourdough loaf', 7.99, 'loaf', 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800', 20, true, 'Village Bakery', 'Vermont', true),
    (baked_id, 'Whole Wheat Bread', 'Fresh whole wheat bread', 6.49, 'loaf', 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800', 25, true, 'Village Bakery', 'Vermont', true),
    (baked_id, 'Croissants', 'Buttery croissants', 8.99, 'pack of 6', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800', 15, true, 'Village Bakery', 'Vermont', false),
    (baked_id, 'Blueberry Muffins', 'Fresh blueberry muffins', 9.99, 'pack of 6', 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800', 20, true, 'Village Bakery', 'Vermont', false);

    -- Insert Honey & Preserves
    INSERT INTO products (category_id, name, description, price, unit, image_url, stock_quantity, is_available, farm_name, farm_location, is_organic) VALUES
    (honey_id, 'Raw Honey', 'Pure raw wildflower honey', 14.99, 'jar', 'https://images.unsplash.com/photo-1587049352846-4a222e784587?w=800', 40, true, 'Bee Happy Apiary', 'Vermont', true),
    (honey_id, 'Strawberry Jam', 'Homemade strawberry jam', 8.99, 'jar', 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800', 30, true, 'Berry Patch Farm', 'Vermont', true),
    (honey_id, 'Blueberry Preserves', 'Small-batch blueberry preserves', 9.49, 'jar', 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=800', 25, true, 'Berry Patch Farm', 'Vermont', true),
    (honey_id, 'Apple Butter', 'Spiced apple butter', 7.99, 'jar', 'https://images.unsplash.com/photo-1568471173238-64ed8e7e9d9f?w=800', 35, true, 'Orchard Hills', 'Vermont', false);

END $$;
