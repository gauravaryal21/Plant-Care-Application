/*
  Adds the selected botanical common name and photo credits to plant records.
  Coordinates for local weather are deliberately kept in browser storage and
  are not written to the account database.
*/

ALTER TABLE public.plants
  ADD COLUMN IF NOT EXISTS common_name text,
  ADD COLUMN IF NOT EXISTS photo_attribution text,
  ADD COLUMN IF NOT EXISTS photo_license text,
  ADD COLUMN IF NOT EXISTS photo_source_url text;

COMMENT ON COLUMN public.plants.common_name IS 'Common name selected or entered by the user.';
COMMENT ON COLUMN public.plants.photo_attribution IS 'Attribution text for the selected plant photo.';
COMMENT ON COLUMN public.plants.photo_license IS 'License code for the selected plant photo.';
COMMENT ON COLUMN public.plants.photo_source_url IS 'Source page for the selected plant photo.';
