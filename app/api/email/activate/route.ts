import { NextResponse } from "next/server";
import { NextRequest } from "next/server"; // Added import
import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email, name, tagId } = await request.json();

    // Validate input
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Invalid email format:", email);
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }
    if (!name || !tagId) {
      console.error("❌ Missing required fields:", { name, tagId });
      return NextResponse.json(
        { success: false, error: "Name and tag ID are required" },
        { status: 400 }
      );
    }

    // Send activation email
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "Your TapMeSaveMe™ Tag is Activated",
      text: `
Your TapMeSaveMe™ Tag is Activated!

Hi ${name || "User"},

Congratulations! Your TapMeSaveMe™ tag ${tagId || "N/A"} has been successfully activated.
Your tag is now ready to provide critical information to emergency responders when needed.

To access your emergency profile, tap your NFC-enabled device on the tag or visit: https://www.tapmesaveme.com/t/${tagId}

Need assistance? Reply to this email or contact us at support@tapmesaveme.com.

---
TapMeSaveMe™ | Your Safety, Our Priority
Visit our website: https://www.tapmesaveme.com
Contact Support: support@tapmesaveme.com
© 2025 TapMeSaveMe. All rights reserved.
      `,
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #333333;">
          <!-- Content -->
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
            <h1 style="font-size: 24px; color: #D52D2D; margin-bottom: 20px;">Your TapMeSaveMe™ Tag is Activated!</h1>
            <p style="font-size: 16px; margin-bottom: 15px;">Hi ${name || "User"},</p>
            <p style="font-size: 16px; margin-bottom: 15px;">
              Congratulations! Your TapMeSaveMe™ tag <strong>${tagId || "N/A"}</strong> has been successfully activated.
              Your tag is now ready to provide critical information to emergency responders when needed.
            </p>
            <p style="font-size: 16px; margin-bottom: 15px;">
              To access your emergency profile, simply tap your NFC-enabled device on the tag or visit the link below:
            </p>
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="https://activate.tapmesaveme.com/t/${tagId}" style="display: inline-block; background-color: #D52D2D; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                View Your Profile
              </a>
            </div>
            <p style="font-size: 16px; margin-bottom: 15px;">
              Need assistance? Reply to this email or contact our support team at any time.
            </p>
            <p style="font-size: 14px; color: #666666; margin-bottom: 0;">
              <small>Reply to this email for support.</small>
            </p>
          </div>
          <!-- Footer -->
          <div style="background-color: #1e293b; padding: 20px; display: flex; justify-content: flex-start; align-items: center;">
            <div style="width: 100px; height: 100px; border-radius: 8px; background-color: #ffffff; margin-right: 20px; margin-left: 30px;">
              <img src="https://www.tapmesaveme.com/Logo.png?height=70&width=80" alt="TapMeSaveMe Logo" style="max-width: 100px; height: auto; display: block; margin: 0px; border-radius: 10px;" />
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
      `,
    };

    await transporter.sendMail(mailOptions);
    //console.log("Activation email sent successfully");

    return NextResponse.json({
      success: true,
      message: "Activation email sent successfully",
    });
  } catch (error: any) {
    console.error("💥 Email sending error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send activation email",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
