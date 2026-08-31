-- A private customer tour must remain outside the public marketplace even if
-- a future write path forgets to clear isPublished.
ALTER TABLE "Tour"
ADD CONSTRAINT "Tour_private_not_published_check"
CHECK (NOT ("isPrivate" AND "isPublished"));
