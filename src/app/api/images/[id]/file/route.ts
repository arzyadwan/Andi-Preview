import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Fetch metadata
    const { data: image, error: dbError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (dbError) {
      console.error('Database fetch error:', dbError);
      return new Response('Database error', { status: 500 });
    }

    if (!image) {
      return new Response('Image not found', { status: 404 });
    }

    // Check expiration
    const expiresAt = new Date(image.expires_at).getTime();
    const now = Date.now();

    if (now > expiresAt) {
      console.log(`Image file request ${id} has expired. Performing on-demand self-destruct.`);
      
      // Delete file from Storage
      const { error: storageError } = await supabaseAdmin.storage
        .from('ephemeral-images')
        .remove([image.storage_path]);
      
      if (storageError) {
        console.error('Failed to delete expired file:', storageError);
      }

      // Delete record from Database
      const { error: deleteError } = await supabaseAdmin
        .from('images')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Failed to delete expired record:', deleteError);
      }

      return new Response('Image has expired', { status: 404 });
    }

    // Download file from private Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('ephemeral-images')
      .download(image.storage_path);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return new Response('Failed to download image file', { status: 500 });
    }

    // Convert Blob to ArrayBuffer to stream
    const arrayBuffer = await fileData.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': image.content_type || 'image/png',
        'Cache-Control': 'no-store, max-age=0', // Do not cache private ephemeral files
      },
    });
  } catch (error: any) {
    console.error('File route error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
