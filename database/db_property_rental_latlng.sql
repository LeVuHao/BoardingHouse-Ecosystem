USE property_rental;

ALTER TABLE properties
ADD COLUMN latitude DECIMAL(10, 7),
ADD COLUMN longitude DECIMAL(10, 7);

ALTER TABLE forum_posts
ADD COLUMN latitude DECIMAL(10, 7),
ADD COLUMN longitude DECIMAL(10, 7);
