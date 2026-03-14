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

        // Wait for device to process command, then fetch updated state
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const deviceStatus = await tuyaContext.request({
                path: `/v1.0/devices/${deviceId}`,
                method: 'GET',
            });

            return NextResponse.json({
                success: (result as any)?.success ?? true,
                device: (deviceStatus as any)?.result
            });
        } catch (fetchError) {
            // If status fetch fails, return success without updated device
            console.warn('[API] /control: Failed to fetch updated status:', fetchError);
            return NextResponse.json({
                success: (result as any)?.success ?? true
            });
        }
    } catch (error: any) {
        console.error('[API] /control error:', error.message);
        return NextResponse.json(
            { success: false, msg: error.message || 'Failed to send command' },
            { status: 500 }
        );
    }
}
