import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()
    const { email } = formData

    // Validate email input
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    // Mailchimp API details
    const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY
    const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID
    const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_SERVER_PREFIX) {
      console.log("Opt-in signup (demo mode):", { email })
      return NextResponse.json({ success: true })
    }

    // Compute subscriber hash
    const subscriberHash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex")

    // Check if subscriber exists
    const checkResponse = await fetch(
      `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (checkResponse.ok) {
      // Subscriber exists, add "Opt-in" tag
      const updateResponse = await fetch(
        `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: email.toLowerCase(),
            status_if_new: "subscribed",
            tags: ["Opt-in","Activated-sent"],
          }),
        },
      )

      if (updateResponse.ok) {
        return NextResponse.json({ success: true })
      } else {
        const error = await updateResponse.json()
        console.error("Failed to update subscriber:", error)
        return NextResponse.json({ error: error.detail || "Failed to update subscriber" }, { status: 400 })
      }
    } else if (checkResponse.status === 404) {
      // Subscriber does not exist, create new subscriber with "Opt-in" tag
      const subscribeResponse = await fetch(
        `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${MAILCHIMP_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email_address: email.toLowerCase(),
            status: "subscribed",
            tags: ["Opt-in","Activated-sent"],
          }),
        },
      )

      if (subscribeResponse.ok) {
        return NextResponse.json({ success: true })
      } else {
        const error = await subscribeResponse.json()
        console.error("Failed to subscribe user:", error)
        return NextResponse.json({ error: error.detail || "Failed to subscribe user" }, { status: 400 })
      }
    } else {
      // Other errors when checking subscriber
      const error = await checkResponse.json()
      console.error("Failed to check subscriber:", error)
      return NextResponse.json({ error: error.detail || "Failed to check subscriber" }, { status: 400 })
    }
  } catch (error) {
    console.error("Opt-in API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}