import { NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/firebase/firebase.service';

export async function GET() {
  try {
    const scans = await FirebaseService.listScans();
    return NextResponse.json({ success: true, data: scans });
  } catch (error: unknown) {
    console.error('Failed to get Firebase scans:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch scans' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await FirebaseService.clearScans();
    return NextResponse.json({ success: true, message: 'All scans cleared' });
  } catch (error: unknown) {
    console.error('Failed to clear Firebase scans:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear scans' }, { status: 500 });
  }
}
