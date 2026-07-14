import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

function isAdminAuthenticated() {
  const cookieStore = cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated_arzyadwan';
}

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    
    // Fetch all active images
    const { data: images, error } = await supabaseAdmin
      .from('images')
      .select('id, group_id, name, created_at, expires_at')
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Group images by group_id
    const groupsMap = new Map<string, {
      group_id: string;
      created_at: string;
      expires_at: string;
      files: { id: string; name: string }[];
    }>();

    images?.forEach((img) => {
      if (!groupsMap.has(img.group_id)) {
        groupsMap.set(img.group_id, {
          group_id: img.group_id,
          created_at: img.created_at,
          expires_at: img.expires_at,
          files: [],
        });
      }
      groupsMap.get(img.group_id)!.files.push({
        id: img.id,
        name: img.name,
      });
    });

    const groupsList = Array.from(groupsMap.values());

    return NextResponse.json({ groups: groupsList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil data' }, { status: 500 });
  }
}
