-- Update image URLs to use Unsplash with width parameter for optimized loading

-- Update category images
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800' WHERE name = 'Vegetables';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800' WHERE name = 'Fruits';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800' WHERE name = 'Dairy & Eggs';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800' WHERE name = 'Meat & Poultry';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800' WHERE name = 'Baked Goods';
UPDATE categories SET image_url = 'https://images.unsplash.com/photo-1587049352846-4a222e784587?w=800' WHERE name = 'Honey & Preserves';

-- Update product images
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800' WHERE name = 'Organic Tomatoes';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=800' WHERE name = 'Fresh Lettuce';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800' WHERE name = 'Baby Carrots';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800' WHERE name = 'Bell Peppers';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1628773822990-202f1c6d0e43?w=800' WHERE name = 'Broccoli';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800' WHERE name = 'Spinach';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=800' WHERE name = 'Zucchini';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=800' WHERE name = 'Cucumbers';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800' WHERE name = 'Honeycrisp Apples';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800' WHERE name = 'Fresh Strawberries';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800' WHERE name = 'Blueberries';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1629828874514-d5e3b3f6f1f4?w=800' WHERE name = 'Peaches';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800' WHERE name = 'Pears';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1577069861033-55d04cec4ef5?w=800' WHERE name = 'Raspberries';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800' WHERE name = 'Farm Fresh Eggs';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800' WHERE name = 'Whole Milk';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800' WHERE name = 'Cheddar Cheese';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800' WHERE name = 'Greek Yogurt';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=800' WHERE name = 'Butter';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800' WHERE name = 'Ground Beef';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800' WHERE name = 'Chicken Breast';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=800' WHERE name = 'Pork Chops';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800' WHERE name = 'Bacon';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800' WHERE name = 'Sourdough Bread';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800' WHERE name = 'Whole Wheat Bread';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800' WHERE name = 'Croissants';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800' WHERE name = 'Blueberry Muffins';

UPDATE products SET image_url = 'https://images.unsplash.com/photo-1587049352846-4a222e784587?w=800' WHERE name = 'Raw Honey';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=800' WHERE name = 'Strawberry Jam';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1557308536-ee471ef2c390?w=800' WHERE name = 'Blueberry Preserves';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1568471173238-64ed8e7e9d9f?w=800' WHERE name = 'Apple Butter';
