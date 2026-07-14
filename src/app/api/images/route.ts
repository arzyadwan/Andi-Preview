import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const expiresInStr = formData.get('expiresInMinutes') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Uploaded file is not an image' }, { status: 400 });
    }

    // Limit file size to 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const expiresInMinutes = parseInt(expiresInStr || '60', 10);
    if (isNaN(expiresInMinutes) || expiresInMinutes <= 0) {
      return NextResponse.json({ error: 'Invalid expiration time' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop() || 'png';
    const id = crypto.randomUUID();
    const storagePath = `uploads/${id}.${fileExtension}`;

    // Upload file to Supabase Storage (Private bucket)
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: storageError } = await supabaseAdmin.storage
      .from('ephemeral-images')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json({ error: 'Failed to save image in storage' }, { status: 500 });
    }

    // Calculate expiration timestamp (in UTC ISO format)
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    // Insert metadata into database
    const { error: dbError } = await supabaseAdmin
      .from('images')
      .insert({
        id,
        name: file.name,
        storage_path: storagePath,
        content_type: file.type,
        expires_at: expiresAt,
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      // Clean up the uploaded file since DB insert failed to avoid orphaned files
      await supabaseAdmin.storage.from('ephemeral-images').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to save metadata in database' }, { status: 500 });
    }

    // Construct the share link
    const origin = request.nextUrl.origin;
    const shareUrl = `${origin}/shared/${id}`;

    return NextResponse.json({
      success: true,
      id,
      shareUrl,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
