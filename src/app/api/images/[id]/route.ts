import { NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check expiration
    const expiresAt = new Date(image.expires_at).getTime();
    const now = Date.now();

    if (now > expiresAt) {
      console.log(`Image ${id} has expired. Performing on-demand self-destruct.`);
      
      // Delete file from Storage
      const { error: storageError } = await supabaseAdmin.storage
        .from('ephemeral-images')
        .remove([image.storage_path]);
      
      if (storageError) {
        console.error('Failed to delete expired file from storage:', storageError);
      }

      // Delete record from Database
      const { error: deleteError } = await supabaseAdmin
        .from('images')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Failed to delete expired record from database:', deleteError);
      }

      return NextResponse.json({ error: 'Image has expired and was deleted' }, { status: 404 });
    }

    // Return active image details (exclude internal storage path)
    return NextResponse.json({
      id: image.id,
      name: image.name,
      expires_at: image.expires_at,
      created_at: image.created_at,
      content_type: image.content_type,
    });
  } catch (error: any) {
    console.error('Metadata route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
