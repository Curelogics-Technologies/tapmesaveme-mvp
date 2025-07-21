const functions = require("firebase-functions")
const admin = require("firebase-admin")
const bcrypt = require("bcryptjs")

admin.initializeApp()

// Cloud Function to handle secure tag updates
exports.updateTag = functions.https.onCall(async (data, context) => {
  try {
    const { tagId, pin, updates } = data

    if (!tagId || !pin || !updates) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required parameters")
    }

    // Get the tag document
    const tagRef = admin.firestore().collection("tags").doc(tagId)
    const tagDoc = await tagRef.get()

    if (!tagDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Tag not found")
    }

    const tagData = tagDoc.data()

    // Verify PIN
    const pinValid = await bcrypt.compare(pin, tagData.pinHash)
    if (!pinValid) {
      throw new functions.https.HttpsError("permission-denied", "Invalid PIN")
    }

    // Update the tag with new data
    await tagRef.update({
      ...updates,
      "analytics.lastTapped": admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating tag:", error)
    throw new functions.https.HttpsError("internal", "Failed to update tag")
  }
})

// Cloud Function to handle Mailchimp integration
exports.syncMailchimp = functions.firestore.document("tags/{tagId}").onCreate(async (snap, context) => {
  const tagData = snap.data()

  try {
    // Add to Mailchimp audience
    // Implementation depends on your Mailchimp setup
    console.log("New tag created, syncing with Mailchimp:", tagData.ownerEmail)

    // You would implement actual Mailchimp API calls here
  } catch (error) {
    console.error("Error syncing with Mailchimp:", error)
  }
})
