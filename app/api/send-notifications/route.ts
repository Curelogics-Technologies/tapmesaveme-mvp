import { NextRequest, NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const { tokens, tagId, fullName, tapCount } = await request.json();

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ success: false, message: 'No tokens provided' });
    }

    const expo = new Expo();

    const validTokens = tokens.filter((token: string) => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid tokens' });
    }

    const messages = validTokens.map((token: string) => ({
      to: token,
      sound: 'default',
      title: '🚨 Emergency Tag Accessed',
      body: `${fullName}'s tag ${tagId} is been accessed now!`,
      data: { 
        tagId, 
        fullName,
        tapCount,
        type: 'emergency_tag_tapped'
      },
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Expo chunk error:', error);
      }
    }

    const successCount = tickets.filter((t: any) => !t.error).length;

    return NextResponse.json({
      success: true,
      sent: successCount,
      total: tokens.length,
      tickets,
    });
  } catch (error) {
    console.error('Notification API error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}