import { NextRequest, NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase/firebase.service';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // If the user is logged out (no userId), strictly return an empty array
    if (!userId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const scans = await FirebaseService.listUserScans(userId);
    return NextResponse.json({ success: true, data: scans });
  } catch (error: unknown) {
    console.error('Failed to get Firebase scans:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch scans' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required to clear scans' }, { status: 400 });
    }

    await FirebaseService.clearUserScans(userId);
    return NextResponse.json({ success: true, message: 'User scans cleared successfully' });
  } catch (error: unknown) {
    console.error('Failed to clear Firebase scans:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear scans' }, { status: 500 });
  }
}
