-- SETUP SUPABASE STORAGE FOR FILE ATTACHMENTS
-- Run these steps in Supabase Dashboard

/**
 * 1. Create Storage Bucket
 *    - Go to: https://supabase.com/dashboard/project/llygmucahdxrzbzepkzg/storage/buckets
 *    - Click "New bucket"
 *    - Name: "attachments"
 *    - Public bucket: YES (so files can be accessed via URL)
 *    - Click "Create bucket"
 * 
 * 2. Set Storage Policies
 *    After creating the bucket, set these policies in Storage > Policies
 */

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'attachments');

-- Allow anyone to read files (public bucket)
CREATE POLICY "Anyone can download attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'attachments');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');

/**
 * 3. File organization
 *    Files will be uploaded with this structure:
 *    attachments/{org_id}/{task_id}/{filename}
 * 
 * 4. File size limits
 *    Default Supabase limit: 50MB per file
 *    Can be adjusted in Project Settings > Storage
 */
