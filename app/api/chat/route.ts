import { NextRequest, NextResponse } from 'next/server';

const MAX_MESSAGE_LENGTH = 500;
const SYSTEM_INSTRUCTION = `You are the Cricket Arena assistant.
You answer only relevant cricket-ground, venue, booking, payment, and platform questions.
Do not invent venue availability, prices, or bookings.
If live data is required, tell the user to check the actual venue or booking page.
Never claim that a booking or payment was completed unless the application confirms it.
Keep replies concise, helpful, and grounded in the Cricket Arena product.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return NextResponse.json({ error: 'Please enter a question before sending the message.' }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Please keep messages under ${MAX_MESSAGE_LENGTH} characters.` }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'The assistant is temporarily unavailable.' }, { status: 503 });
    }

    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
      }),
    });

    const payload = await apiResponse.json().catch(() => null) as Record<string, any> | null;

    if (!apiResponse.ok) {
      console.error('Gemini API error:', payload);
      return NextResponse.json({ error: 'The assistant could not respond right now.' }, { status: 502 });
    }

    const reply = payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim();

    if (!reply) {
      return NextResponse.json({ error: 'The assistant returned an empty response.' }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chatbot request failed:', error);
    return NextResponse.json({ error: 'The assistant could not respond right now.' }, { status: 500 });
  }
}
