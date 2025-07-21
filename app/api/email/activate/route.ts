// import { type NextRequest, NextResponse } from "next/server";
// import { createHash } from "crypto";

// export async function POST(request: NextRequest) {
//   try {
//     const { email, name, tagId } = await request.json();

//     // Validate environment variables
//     const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
//     const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;
//     const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

//     if (!MAILCHIMP_API_KEY || !MAILCHIMP_SERVER_PREFIX || !MAILCHIMP_AUDIENCE_ID) {
//       console.error("❌ Mailchimp configuration missing");
//       return NextResponse.json(
//         { success: false, error: "Mailchimp API key, server prefix, or audience ID missing" },
//         { status: 500 }
//       );
//     }

//     // Validate input
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       console.error("❌ Invalid email format:", email);
//       return NextResponse.json(
//         { success: false, error: "Invalid email address" },
//         { status: 400 }
//       );
//     }
//     if (!name || !tagId) {
//       console.error("❌ Missing required fields:", { name, tagId });
//       return NextResponse.json(
//         { success: false, error: "Name and tag ID are required" },
//         { status: 400 }
//       );
//     }

//     // Step 1: Ensure contact is in audience
//     const subscriberHash = createHash("md5").update(email.toLowerCase()).digest("hex");
//     const addContactUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`;
//     const contactResponse = await fetch(addContactUrl, {
//       method: "PUT",
//       headers: {
//         Authorization: `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64")}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         email_address: email,
//         status_if_new: "subscribed",
//         merge_fields: {
//           FNAME: name || "User",
//           TAGID: tagId || "",
//         },
//       }),
//     });

//     const contactData = await contactResponse.json();
//     if (!contactResponse.ok && contactData.status !== 200) {
//       console.error("❌ Failed to add contact:", contactData);
//       return NextResponse.json(
//         { success: false, error: contactData.detail || "Failed to add contact" },
//         { status: contactResponse.status }
//       );
//     }

//     // Step 2: Create a campaign
//     const createCampaignUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns`;
//     const campaignResponse = await fetch(createCampaignUrl, {
//       method: "POST",
//       headers: {
//         Authorization: `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64")}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         type: "regular",
//         recipients: {
//           list_id: MAILCHIMP_AUDIENCE_ID,
//           segment_opts: {
//             match: "any",
//             conditions: [
//               {
//                 condition_type: "EmailAddress",
//                 op: "is",
//                 field: "EMAIL",
//                 value: email,
//               },
//             ],
//           },
//         },
//         settings: {
//           subject_line: "Your TapMeSaveMe™ Tag is Activated",
//           from_name: "TapMeSaveMe Team",
//           reply_to: "Founder@tapmesaveme.com",
//           title: `Activation Email for ${email}`,
//         },
//       }),
//     });

//     const campaignData = await campaignResponse.json();
//     if (!campaignResponse.ok) {
//       console.error("❌ Failed to create campaign:", campaignData);
//       return NextResponse.json(
//         { success: false, error: campaignData.detail || "Failed to create campaign", details: campaignData },
//         { status: campaignResponse.status }
//       );
//     }

//     // Step 3: Set campaign content
//     const contentUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns/${campaignData.id}/content`;
//     const contentResponse = await fetch(contentUrl, {
//       method: "PUT",
//       headers: {
//         Authorization: `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64")}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         html: `
//           <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #333333;">
//             <!-- Content -->
//             <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
//               <h1 style="font-size: 24px; color: #1e40af; margin-bottom: 20px;">Your TapMeSaveMe™ Tag is Activated!</h1>
//               <p style="font-size: 16px; margin-bottom: 15px;">Hi ${name || "User"},</p>
//               <p style="font-size: 16px; margin-bottom: 15px;">
//                 Congratulations! Your TapMeSaveMe™ tag <strong>${tagId || "N/A"}</strong> has been successfully activated.
//                 Your tag is now ready to provide critical information to emergency responders when needed.
//               </p>
//               <p style="font-size: 16px; margin-bottom: 15px;">
//                 To access your emergency profile, simply tap your NFC-enabled device on the tag or visit the link below:
//               </p>
//               <div style="text-align: center; margin-bottom: 20px;">
//                 <a href="https://www.tapmesaveme.com/t/${tagId}" style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
//                   View Your Profile
//                 </a>
//               </div>
//               <p style="font-size: 16px; margin-bottom: 15px;">
//                 Need assistance? Reply to this email or contact our support team at any time.
//               </p>
//               <p style="font-size: 14px; color: #666666; margin-bottom: 0;">
//                 <small>Reply to this email for support.</small>
//               </p>
//             </div>
//             <!-- Footer -->
//             <div style="background-color: #1e293b; padding: 20px; display: flex; justify-content: flex-start; align-items: center;">
//               <div style="width: 100px; height: 100px; border-radius: 8px; background-color: #ffffff; margin-right: 20px; margin-left: 30px;">
//                 <img src="https://www.tapmesaveme.com/assets/images/image01.jpg?v=536d4834" alt="TapMeSaveMe Logo" style="max-width: 100px; height: auto; display: block; margin: 0px; border-radius: 10px;" />
//               </div>
//               <div style="margin-left: 40px; color: #d1d5db;margin-top: 5px;">
//                 <p style="margin: 0 0 10px;">TapMeSaveMe™ | Your Safety, Our Priority</p>
//                 <p style="margin: 0 0 10px;">
//                   <a href="https://www.tapmesaveme.com" style="color: #60a5fa; text-decoration: none;">Visit our website</a> | 
//                   <a href="mailto:support@tapmesaveme.com" style="color: #60a5fa; text-decoration: none;">Contact Support</a>
//                 </p>
//                 <p style="margin: 0;">© 2025 TapMeSaveMe. All rights reserved.</p>
//               </div>
//             </div>
//           </div>
//         `,
//         plain_text: `
// Your TapMeSaveMe™ Tag is Activated!

// Hi ${name || "User"},

// Congratulations! Your tag ${tagId || "N/A"} has been successfully activated. Your tag is now ready to provide critical information to emergency responders when needed.

// To access your emergency profile, tap your NFC-enabled device on the tag or visit: https://www.tapmesaveme.com/t/${tagId}

// Need assistance? Reply to this email or contact us at support@tapmesaveme.com.

// ---
// TapMeSaveMe™ | Your Safety, Our Priority
// Visit our website: https://www.tapmesaveme.com
// Contact Support: support@tapmesaveme.com
// © 2025 TapMeSaveMe. All rights reserved.
//         `,
//       }),
//     });

//     if (!contentResponse.ok) {
//       const contentData = await contentResponse.json();
//       console.error("❌ Failed to set campaign content:", contentData);
//       return NextResponse.json(
//         { success: false, error: contentData.detail || "Failed to set campaign content" },
//         { status: contentResponse.status }
//       );
//     }

//     // Step 4: Send the campaign
//     const sendCampaignUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/campaigns/${campaignData.id}/actions/send`;
//     const sendResponse = await fetch(sendCampaignUrl, {
//       method: "POST",
//       headers: {
//         Authorization: `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64")}`,
//         "Content-Type": "application/json",
//       },
//     });

//     if (!sendResponse.ok) {
//       const sendData = await sendResponse.json();
//       console.error("❌ Failed to send campaign:", sendData);
//       return NextResponse.json(
//         { success: false, error: sendData.detail || "Failed to send campaign", details: sendData },
//         { status: sendResponse.status }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       message: "Activation email sent successfully",
//       campaignId: campaignData.id,
//     });
//   } catch (error: any) {
//     console.error("💥 Email sending error:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message || "Failed to send activation email",
//         stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { NextRequest } from "next/server"; // Added import

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

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
    const msg = {
      to: email,
      from: "Founder@tapmesaveme.com",
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
            <h1 style="font-size: 24px; color: #1e40af; margin-bottom: 20px;">Your TapMeSaveMe™ Tag is Activated!</h1>
            <p style="font-size: 16px; margin-bottom: 15px;">Hi ${name || "User"},</p>
            <p style="font-size: 16px; margin-bottom: 15px;">
              Congratulations! Your TapMeSaveMe™ tag <strong>${tagId || "N/A"}</strong> has been successfully activated.
              Your tag is now ready to provide critical information to emergency responders when needed.
            </p>
            <p style="font-size: 16px; margin-bottom: 15px;">
              To access your emergency profile, simply tap your NFC-enabled device on the tag or visit the link below:
            </p>
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="https://www.tapmesaveme.com/t/${tagId}" style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
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
      `,
    };

    await sgMail.send(msg);
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