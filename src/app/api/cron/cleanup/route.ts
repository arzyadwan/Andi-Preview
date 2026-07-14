import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Authenticate cron request
    const authHeader = request.headers.get('Authorization');
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET || authHeader !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Fetch all expired images
    const { data: expiredImages, error: fetchError } = await supabaseAdmin
      .from('images')
      .select('id, storage_path')
      .lt('expires_at', now);

    if (fetchError) {
      console.error('Failed to fetch expired images for cron:', fetchError);
      return NextResponse.json({ error: 'Database fetch error' }, { status: 500 });
    }

    if (!expiredImages || expiredImages.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No expired images to clean up.' });
    }

    console.log(`Cron cleanup: Found ${expiredImages.length} expired images to delete.`);

    // Extract storage paths and IDs to delete
    const storagePathsToDelete = expiredImages.map((img) => img.storage_path);
    const idsToDelete = expiredImages.map((img) => img.id);

    // Delete files from storage in bulk
    const { error: storageDeleteError } = await supabaseAdmin.storage
      .from('ephemeral-images')
      .remove(storagePathsToDelete);

    if (storageDeleteError) {
      console.error('Failed to bulk delete files from storage:', storageDeleteError);
    }

    // Delete rows from database in bulk
    const { error: dbDeleteError } = await supabaseAdmin
      .from('images')
      .delete()
      .in('id', idsToDelete);

    if (dbDeleteError) {
      console.error('Failed to bulk delete records from database:', dbDeleteError);
      return NextResponse.json({ error: 'Database delete error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: expiredImages.length,
      deletedIds: idsToDelete,
    });
  } catch (error: any) {
    console.error('Cron route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
