import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { password } = await req.json();
        const correctPassword = process.env.ACCESS_PASSWORD;

        console.log('Login attempt:', { passwordProvided: !!password, envPasswordSet: !!correctPassword });

        if (!correctPassword) {
            console.error('ACCESS_PASSWORD env var is missing');
            return NextResponse.json({ success: false, msg: 'Erro de configuração no servidor (senha não definida).' }, { status: 500 });
        }

        // Simple trim to avoid copy-paste whitespace issues
        if (password.trim() === correctPassword.trim()) {
            const response = NextResponse.json({ success: true });

            response.cookies.set('auth_token', 'authenticated', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
            });

            return response;
        }

        return NextResponse.json({ success: false, msg: 'Senha incorreta' }, { status: 401 });
    } catch (e) {
        console.error('Login error:', e);
        return NextResponse.json({ success: false, msg: 'Erro interno' }, { status: 500 });
    }
}
