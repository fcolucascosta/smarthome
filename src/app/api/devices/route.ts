import { NextResponse } from 'next/server';
import { tuyaContext } from '@/lib/tuya';

export async function GET() {
    const uid = process.env.TUYA_UID;
    if (!uid) {
        return NextResponse.json({ success: false, msg: 'TUYA_UID not configured' }, { status: 500 });
    }

    try {
        const result = await tuyaContext.request({
            path: `/v1.0/users/${uid}/devices`,
            method: 'GET',
        });
        // SDK may return AxiosResponse or direct data — handle both
        const data = result?.data ?? result;
        return NextResponse.json(JSON.parse(JSON.stringify(data)));
    } catch (error: any) {
        console.error('[API] /devices error:', error.message);
        return NextResponse.json(
            { success: false, msg: error.message || 'Failed to fetch devices' },
            { status: 500 }
        );
    }
}
