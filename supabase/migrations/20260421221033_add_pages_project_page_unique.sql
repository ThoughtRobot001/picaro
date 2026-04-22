ALTER TABLE public.pages
ADD CONSTRAINT pages_project_page_unique
UNIQUE (project_id, page_number);
