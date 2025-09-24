import { NextResponse, NextRequest } from "next/server";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import nodemailer from "nodemailer";

// configure transporter once
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,    
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  if (!db) {
    console.error("Firebase not initialized");
    return NextResponse.json(
      { success: false, error: "Firebase not initialized" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      email,
      full_name,
      phone,
      lead_source,
      campaign_name,
      created_at,
      form_name,
      lead_id,
    } = body;

    // Save lead to Firestore 'leads' collection
    await addDoc(collection(db, "leads"), {
      email: email || "",
      name: full_name || "",
      phone: phone || "",
      source: lead_source || "Unknown",
      campaign_name: campaign_name || "",
      created_at: created_at || new Date().toISOString(),
      form_name: form_name || "",
      lead_id: lead_id || "",
      timestamp: new Date(),
    });

    // Send signup email
    const greeting = full_name ? `Hi ${full_name},` : "Hi there,";
    const htmlBody = `
      <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #333333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
          <h1 style="font-size: 24px; color: #1e40af; margin-bottom: 20px;">Thanks for Joining the TapMeSaveMe™ Mission</h1>
          <p style="font-size: 16px; margin-bottom: 15px;">${greeting}</p>
          <p style="font-size: 16px; margin-bottom: 15px;">
            Thanks for signing up! You’ll want to hold onto your discount code—it’ll be valid once we launch our official store after Kickstarter. But if you want the absolute lowest prices we’ll ever offer, those will be available exclusively during our Kickstarter launch as a special early bird reward for our first supporters.
          </p>
          <p style="font-size: 16px; margin-bottom: 15px;">
            TapMeSaveMe™ uses NFC technology to help protect your kids, pets, and elderly loved ones. Just tap the sticker or bracelet with a phone to instantly access emergency info. No app needed.
          </p>
          <p style="font-size: 16px; margin-bottom: 15px;">
            We’ll keep you updated with launch dates, product demos, and exclusive offers.
          </p>
          <p style="font-size: 16px; margin-bottom: 15px;">
            In the meantime, follow us on social: <strong>TikTok & Instagram: @TapMeSaveMe</strong>
          </p>
          <p style="font-size: 16px; margin-bottom: 15px;">
            Thanks for helping us bring this life-saving product to the world!
          </p>
          <p style="font-size: 16px; margin-bottom: 15px;">
            Blessings,<br>Michael Lutz<br>Founder, TapMeSaveMe™
          </p>
        </div>
        <div style="background-color: #1e293b; padding: 20px; display: flex; justify-content: flex-start; align-items: center;">
          <div style="width: 100px; height: 100px; border-radius: 8px; background-color: #ffffff; margin-left: 30px; margin-right: 20px;">
            <img src="https://www.tapmesaveme.com/assets/images/image01.jpg?v=536d4834" alt="TapMeSaveMe Logo" style="max-width: 100px; height: auto; display: block; margin: 0px; border-radius: 10px;" />
          </div>
          <div style="margin-left: 40px; color: #d1d5db; margin-top: 5px;">
            <p style="margin: 0 0 10px;">TapMeSaveMe™ | Your Safety, Our Priority</p>
            <p style="margin: 0 0 10px;">
              <a href="https://www.tapmesaveme.com" style="color: #60a5fa; text-decoration: none;">Visit our website</a> | 
              <a href="mailto:support@tapmesaveme.com" style="color: #60a5fa; text-decoration: none;">Contact Support</a>
            </p>
            <p style="margin: 0;">© 2025 TapMeSaveMe. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    // Validate email before sending
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email || "")) {
      throw new Error("Invalid email address");
    }

    // send email via SMTP
    await transporter.sendMail({
      from: '"TapMeSaveMe™" <Founder@tapmesaveme.com>',
      to: email || "",
      subject: "Thanks for Joining the TapMeSaveMe™ Mission",
      text: `
Thanks for Joining the TapMeSaveMe™ Mission

${greeting}

Thanks for signing up! You’ll want to hold onto your discount code—it’ll be valid once we launch our official store after Kickstarter. But if you want the absolute lowest prices we’ll ever offer, those will be available exclusively during our Kickstarter launch as a special early bird reward for our first supporters.

TapMeSaveMe™ uses NFC technology to help protect your kids, pets, and elderly loved ones. Just tap the sticker or bracelet with a phone to instantly access emergency info. No app needed.
We’ll keep you updated with launch dates, product demos, and exclusive offers.
In the meantime, follow us on social:  TikTok & Instagram: @TapMeSaveMe
Thanks for helping us bring this life-saving product to the world!
Blessings,
Michael Lutz
Founder, TapMeSaveMe™
      `,
      html: htmlBody,
    });

    return NextResponse.json({
      success: true,
      message: "Lead processed successfully",
    });
  } catch (error: any) {
    console.error("Zapier webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process lead",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}