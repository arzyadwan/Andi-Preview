import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // params.id contains the individual image ID
) {
  try {
    const id = params.id;

    // Fetch metadata for this individual image
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
      console.log(`Image ${id} inside group ${image.group_id} has expired. Performing group self-destruct.`);
      
      // Fetch all images in this group to clean up
      const { data: groupImages } = await supabaseAdmin
        .from('images')
        .select('storage_path')
        .eq('group_id', image.group_id);
      
      if (groupImages && groupImages.length > 0) {
        const storagePaths = groupImages.map((img) => img.storage_path);
        
        // Delete all files in the group from private Storage
        await supabaseAdmin.storage
          .from('ephemeral-images')
          .remove(storagePaths);
      }

      // Delete all records in the group from the Database
      await supabaseAdmin
        .from('images')
        .delete()
        .eq('group_id', image.group_id);

      return new Response('Image has expired', { status: 404 });
    }

    // Download the specific file from private Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('ephemeral-images')
      .download(image.storage_path);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return new Response('Failed to download image file', { status: 500 });
    }

    const arrayBuffer = await fileData.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': image.content_type || 'image/png',
        'Cache-Control': 'no-store, max-age=0', // Do not cache private ephemeral files
      },
    });
  } catch (error: any) {
    console.error('Individual file stream route error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
