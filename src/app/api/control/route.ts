import { NextResponse } from 'next/server';
import { tuyaContext } from '@/lib/tuya';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { deviceId, commands } = body;

        if (!deviceId || !commands) {
            return NextResponse.json({ success: false, msg: 'Missing deviceId or commands' }, { status: 400 });
        }

        const result = await tuyaContext.request({
            path: `/v1.0/devices/${deviceId}/commands`,
            method: 'POST',
            body: { commands },
        });
        const data = result?.data ?? result;
        return NextResponse.json(JSON.parse(JSON.stringify(data)));
    } catch (error: any) {
        console.error('[API] /control error:', error.message);
        return NextResponse.json(
            { success: false, msg: error.message || 'Failed to send command' },
            { status: 500 }
        );
    }
}
