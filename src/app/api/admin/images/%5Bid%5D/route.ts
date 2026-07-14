import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

function isAdminAuthenticated() {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated_arzyadwan';
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    // 1. Fetch images in the group to get storage paths
    const { data: images, error: fetchError } = await supabaseAdmin
      .from('images')
      .select('storage_path')
      .eq('group_id', id);

    if (fetchError) throw fetchError;

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'Preview tidak ditemukan atau sudah terhapus' }, { status: 404 });
    }

    // 2. Delete files from storage
    const storagePaths = images.map((img) => img.storage_path);
    const { error: storageError } = await supabaseAdmin.storage
      .from('ephemeral-images')
      .remove(storagePaths);

    if (storageError) {
      console.error('Error deleting files from storage:', storageError);
    }

    // 3. Delete database records
    const { error: dbError } = await supabaseAdmin
      .from('images')
      .delete()
      .eq('group_id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus preview' }, { status: 500 });
  }
}
