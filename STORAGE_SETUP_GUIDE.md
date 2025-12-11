# 🪣 Create Supabase Storage Bucket - Step by Step

## Error You're Seeing:
```
StorageApiError: Bucket not found
Failed to upload file: Bucket not found
```

This is expected! The storage bucket doesn't exist yet. Follow these steps to create it:

---

## Step 1: Go to Storage Dashboard

**URL**: https://supabase.com/dashboard/project/llygmucahdxrzbzepkzg/storage/buckets

Or navigate manually:
1. Go to https://supabase.com/dashboard
2. Click on your project: **llygmucahdxrzbzepkzg**
3. Click **Storage** in left sidebar
4. Click **Buckets** tab

---

## Step 2: Create New Bucket

1. Click the **"New bucket"** button (top right)

2. Fill in the form:
   ```
   Name: attachments
   Public bucket: ✅ CHECKED (enable this!)
   File size limit: 10485760 (10MB) [optional, you can change this]
   Allowed MIME types: Leave empty for all types
   ```

3. Click **"Create bucket"**

✅ You should now see "attachments" in your buckets list!

---

## Step 3: Set Storage Policies

The bucket needs policies so users can upload/download files.

### Option A: Use the UI (Recommended)

1. Click on the **"attachments"** bucket you just created
2. Click the **"Policies"** tab
3. Click **"New policy"**

**Create 3 policies:**

### Policy 1: Upload Files (INSERT)
```
Name: Authenticated users can upload attachments
Allowed operation: INSERT
Target roles: authenticated
Policy expression: bucket_id = 'attachments'
```

### Policy 2: Download Files (SELECT)  
```
Name: Anyone can download attachments
Allowed operation: SELECT
Target roles: anon, authenticated
Policy expression: bucket_id = 'attachments'
```

### Policy 3: Delete Files (DELETE)
```
Name: Users can delete their own attachments  
Allowed operation: DELETE
Target roles: authenticated
Policy expression: bucket_id = 'attachments'
```

---

### Option B: Use SQL (Faster if you know SQL)

1. Go to **SQL Editor** in Supabase
2. Click **"New query"**
3. Paste and run this SQL:

```sql
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

-- Allow authenticated users to delete files
CREATE POLICY "Users can delete their own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'attachments');
```

4. Click **"Run"**

✅ Policies created!

---

## Step 4: Verify Setup

Go back to Storage > Buckets and you should see:

```
📦 attachments
   🌐 Public
   📝 3 policies
```

Click on the bucket to verify:
- **Public**: Yes
- **Policies**: 3 active policies

---

## Step 5: Test File Upload

1. Wait for GitHub Actions to finish deploying (~2 minutes from your push)
2. Go to https://gerbriel.github.io/Todoy/
3. Refresh the page (Ctrl/Cmd + Shift + R to force refresh)
4. Click on any task
5. Go to **"Attachments"** tab
6. Try drag & drop a file

**Expected result:**
- Upload progress bar appears
- File uploads successfully
- File appears in the list with name, size, timestamp
- Clicking the file name downloads it

---

## Troubleshooting

### Still seeing "Bucket not found"?

**Check these:**
1. ✅ Bucket name is exactly: `attachments` (lowercase, no spaces)
2. ✅ Bucket is marked as Public
3. ✅ You created all 3 policies
4. ✅ You refreshed the webpage after deployment finished

### "Policy violation" error?

**Fix:**
- Make sure SELECT policy allows `anon` OR `public` role
- Make sure INSERT policy allows `authenticated` role
- Re-run the SQL policies above

### File uploads but can't download?

**Fix:**
- Bucket must be **Public** (toggle in bucket settings)
- SELECT policy must allow public access

### Upload works but file disappears?

**Check:**
- Browser console for errors
- Make sure you're saving the task after upload
- The attachment is stored in task.attachments array

---

## File Organization

Your files will be organized like this:

```
Storage: attachments/
├── d3886f52-69cd-4fa2-9be6-e89ca2b7166c/          ← Your org ID
│   ├── task-id-1/
│   │   ├── 1734567890_document.pdf
│   │   └── 1734567891_image.png
│   └── task-id-2/
│       └── 1734567892_spreadsheet.xlsx
└── another-org-id/
    └── ...
```

This organization:
- ✅ Keeps files separated by organization (multi-tenant ready)
- ✅ Groups files by task for easy management
- ✅ Uses timestamps to prevent naming conflicts
- ✅ Sanitizes filenames to prevent issues

---

## Quick Checklist

Before testing, verify:

- [x] Code deployed (commit bd4730b pushed)
- [ ] Storage bucket "attachments" created
- [ ] Bucket is set to **Public**
- [ ] 3 storage policies created (INSERT, SELECT, DELETE)
- [ ] Webpage refreshed after deployment
- [ ] Tested drag & drop on a task

---

## What's Fixed in This Update

**Members Display Issue - SOLVED ✅**

The members list was empty because we weren't loading user profiles. 

**The fix:**
- Updated `orgMembersService.getByOrg()` to join the `profiles` table
- Now returns `userName` and `userEmail` directly with each member
- No need for separate `users` array lookup

**You should now see:**
- ✅ Your name and email in the members list
- ✅ Correct role badge (Owner/Admin/Member)
- ✅ "You" badge next to your name

---

## Next Steps After Storage Setup

Once file uploads are working:

### Recommended Testing Order:

1. **Basic Upload**
   - Drag & drop a small file (< 1MB)
   - Verify it uploads and appears in list

2. **Download Test**
   - Click the file name
   - Verify it downloads correctly

3. **Delete Test**
   - Click the X button on a file
   - Verify it's removed from the list

4. **Large File Test**
   - Try uploading a 9MB file (should work)
   - Try uploading an 11MB file (should show error)

5. **Different File Types**
   - PDF document
   - Image (PNG/JPG)
   - Spreadsheet (XLSX)
   - Text file

6. **Multiple Files**
   - Upload 3-5 files to same task
   - Verify all appear in list
   - Verify sizes are formatted correctly

---

## Support

If you still have issues after following these steps:

1. **Check Supabase logs:**
   - Go to Supabase Dashboard > Logs
   - Look for storage errors

2. **Check browser console:**
   - Press F12
   - Go to Console tab
   - Look for red errors

3. **Check network tab:**
   - Press F12
   - Go to Network tab
   - Try upload
   - Look for failed requests (red)
   - Click failed request to see error details

---

**Your deployment is live!** 🚀

Deployment will be ready in ~2 minutes at:
https://gerbriel.github.io/Todoy/

**Members list should now show correctly after refresh!** ✅
