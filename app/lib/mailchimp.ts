// export async function subscribeToMailchimp(email: string, name: string, tagId?: string) {
//   try {
//     console.log("🚀 Starting Mailchimp subscription for:", email);

//     const response = await fetch("/api/mailchimp/subscribe", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ email, name, tagId }),
//     });

//     const data = await response.json();
//     console.log("📥 Mailchimp subscription response:", JSON.stringify(data, null, 2)); // Detailed logging

//     if (!response.ok) {
//       console.error("❌ Mailchimp subscription failed:", data);
//       throw new Error(data.error || "Failed to subscribe to Mailchimp");
//     }

//     console.log("✅ Mailchimp subscription successful:", { success: data.success, message: data.message });
//     return data; // Return full response object
//   } catch (error: any) {
//     console.error("💥 Mailchimp subscription error:", error);
//     throw new Error(`Mailchimp subscription failed: ${error.message}`);
//   }
// }

// export async function sendWelcomeEmail(email: string, name: string, tagId: string) {
//   try {
//     console.log("🚀 Starting welcome email send for:", email);

//     const response = await fetch("/api/email/welcome", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ email, name, tagId }),
//     });

//     const data = await response.json();
//     console.log("📥 Welcome email response:", data);

//     if (!response.ok) {
//       console.error("❌ Welcome email failed:", data);
//       throw new Error(data.error || "Failed to send welcome email");
//     }

//     console.log("✅ Welcome email sent successfully");
//     return data;
//   } catch (error: any) {
//     console.error("💥 Welcome email error:", error);
//     throw new Error(`Welcome email failed: ${error.message}`);
//   }
// }

// export async function sendActivationEmail(email: string, name: string, tagId: string) {
//   try {
//     console.log("🚀 Starting activation email send for:", email);

//     const response = await fetch("/api/email/activate", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ email, name, tagId }),
//     });

//     const data = await response.json();
//     console.log("📥 Activation email response:", data);

//     if (!response.ok) {
//       console.error("❌ Activation email failed:", data);
//       throw new Error(data.error || "Failed to send activation email");
//     }

//     console.log("✅ Activation email sent successfully");
//     return data;
//   } catch (error: any) {
//     console.error("💥 Activation email error:", error);
//     throw new Error(`Activation email failed: ${error.message}`);
//   }
// }