USE property_rental;

ALTER TABLE reviews
ADD COLUMN security_rating INT,
ADD COLUMN cleanliness_rating INT,
ADD COLUMN price_rating INT,
ADD COLUMN landlord_rating INT,
ADD COLUMN landlord_reply TEXT;
