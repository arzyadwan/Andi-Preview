import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // params.id contains the group_id
) {
  try {
    const groupId = params.id;

    // Fetch all image metadata belonging to this group
    const { data: images, error: dbError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('group_id', groupId);

    if (dbError) {
      console.error('Database fetch error:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'Images not found or already deleted' }, { status: 404 });
    }

    // Check expiration based on the first image (they all share the same expires_at)
    const expiresAt = new Date(images[0].expires_at).getTime();
    const now = Date.now();

    if (now > expiresAt) {
      console.log(`Group ${groupId} has expired. Performing group self-destruct.`);
      
      // Get all storage paths in group
      const storagePaths = images.map((img) => img.storage_path);
      
      // Delete all files in the group from private Storage
      const { error: storageError } = await supabaseAdmin.storage
        .from('ephemeral-images')
        .remove(storagePaths);
      
      if (storageError) {
        console.error('Failed to delete expired group files:', storageError);
      }

      // Delete all rows in the group from the Database
      const { error: deleteError } = await supabaseAdmin
        .from('images')
        .delete()
        .eq('group_id', groupId);

      if (deleteError) {
        console.error('Failed to delete expired group records:', deleteError);
      }

      return NextResponse.json({ error: 'Images have expired and were deleted' }, { status: 404 });
    }

    // Return the list of image metadata details (excluding storage paths)
    const responseData = images.map((img) => ({
      id: img.id,
      name: img.name,
      expires_at: img.expires_at,
      created_at: img.created_at,
      content_type: img.content_type,
    }));

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Group metadata route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
