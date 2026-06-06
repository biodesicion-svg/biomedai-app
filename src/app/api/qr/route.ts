import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const nombre = searchParams.get('nombre') || ''
    const codigo = searchParams.get('codigo') || ''

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://probable-funicular-qvq9749wr45jh9wr7-3000.app.github.dev'
    const url = `${baseUrl}/qr/${id}`

    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#1B2B5B', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    })

    return NextResponse.json({ qr: qrDataUrl, url, nombre, codigo })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
