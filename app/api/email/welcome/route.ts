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

    // Send welcome email
    const mailOptions = {
      from: process.env.FROM_EMAIL, // sender address
      to: email, // list of receivers
      subject: "Welcome to TapMeSaveMe™", // Subject line
      text: `
Welcome to TapMeSaveMe™!

Hi ${name || "User"},

Your tag ${tagId || "N/A"} has been successfully activated! Thank you for joining our emergency response system, designed to keep you safe and connected in critical moments.

With your tag, emergency responders can quickly access your vital information, ensuring you receive the care you need.

To update your information, visit: https://www.tapmesaveme.com/t/${tagId}

If you have any questions, contact us at support@tapmesaveme.com.

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
            <h1 style="font-size: 24px; color: #1e40af; margin-bottom: 20px;">Welcome to TapMeSaveMe™!</h1>
            <p style="font-size: 16px; margin-bottom: 15px;">Hi ${name || "User"},</p>
            <p style="font-size: 16px; margin-bottom: 15px;">
              Your TapMeSaveMe™ tag <strong>${tagId || "N/A"}</strong> has been successfully activated!
              Thank you for joining our emergency response system, designed to keep you safe and connected in critical moments.
            </p>
            <p style="font-size: 16px; margin-bottom: 15px;">
              With your tag, emergency responders can quickly access your vital information, ensuring you receive the care you need.
            </p>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Need to update your information? Visit your tag's unique page:
            </p>
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="https://www.tapmesaveme.com/t/${tagId}" style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                Update Your Information
              </a>
            </div>
            <p style="font-size: 16px; margin-bottom: 15px;">
              We're here to support you. If you have any questions, feel free to reach out to our team.
            </p>
          </div>
          <!-- Footer -->
          <div style="background-color: #1e293b; padding: 20px; display: flex; justify-content: flex-start; align-items: center;">
            <div style="width: 100px; height: 100px; border-radius: 8px; background-color: #ffffff; margin-left: 30px; margin-right: 20px;">
              <img src="https://activate.tapmesaveme.com/logo.png?height=70&width=80" alt="TapMeSaveMe Logo" style="max-width: 100px; height: auto; display: block; margin: 0px; border-radius: 10px;" />
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
    //console.log("Welcome email sent successfully");

    return NextResponse.json({
      success: true,
      message: "Welcome email sent successfully",
    });
  } catch (error: any) {
    console.error("💥 Email sending error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send welcome email",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
