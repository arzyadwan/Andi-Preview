import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const expiresInStr = formData.get('expiresInMinutes') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const expiresInMinutes = parseInt(expiresInStr || '60', 10);
    if (isNaN(expiresInMinutes) || expiresInMinutes <= 0) {
      return NextResponse.json({ error: 'Invalid expiration time' }, { status: 400 });
    }

    const groupId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();
    const uploadedImages: any[] = [];

    // Process all uploads
    for (const file of files) {
      // Basic type validation
      if (!file.type.startsWith('image/')) {
        await cleanupUploadedFiles(uploadedImages);
        return NextResponse.json({ error: `File "${file.name}" is not an image` }, { status: 400 });
      }

      // Size validation (Max 10MB)
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        await cleanupUploadedFiles(uploadedImages);
        return NextResponse.json({ error: `File "${file.name}" exceeds the 10MB limit` }, { status: 400 });
      }

      const fileExtension = file.name.split('.').pop() || 'png';
      const id = crypto.randomUUID();
      const storagePath = `uploads/${id}.${fileExtension}`;

      // Upload file to private Supabase Storage
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const { error: storageError } = await supabaseAdmin.storage
        .from('ephemeral-images')
        .upload(storagePath, fileBuffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (storageError) {
        console.error('Storage upload error for:', file.name, storageError);
        await cleanupUploadedFiles(uploadedImages);
        return NextResponse.json({ error: `Failed to upload "${file.name}" to storage` }, { status: 500 });
      }

      uploadedImages.push({
        id,
        group_id: groupId,
        name: file.name,
        storage_path: storagePath,
        content_type: file.type,
        expires_at: expiresAt,
      });
    }

    // Insert all metadata into the database
    const { error: dbError } = await supabaseAdmin
      .from('images')
      .insert(uploadedImages);

    if (dbError) {
      console.error('Database insert error for group:', dbError);
      await cleanupUploadedFiles(uploadedImages);
      return NextResponse.json({ error: 'Failed to save metadata in database' }, { status: 500 });
    }

    const origin = request.nextUrl.origin;
    const shareUrl = `${origin}/shared/${groupId}`;

    return NextResponse.json({
      success: true,
      groupId,
      shareUrl,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Rollback helper to clean up files in storage if the DB transaction fails
async function cleanupUploadedFiles(images: any[]) {
  if (images.length === 0) return;
  const paths = images.map((img) => img.storage_path);
  await supabaseAdmin.storage.from('ephemeral-images').remove(paths);
}
