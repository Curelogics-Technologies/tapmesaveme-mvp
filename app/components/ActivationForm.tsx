"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { doc, setDoc, getDocs, query, where, collection } from "firebase/firestore"
import { db, isFirebaseAvailable } from "../lib/firebase"
import { hashPin } from "../lib/utils"
import { trackEvent } from "../lib/analytics"
import { Plus, Trash2 } from "lucide-react"
import { PhoneInput, defaultCountries, parseCountry } from 'react-international-phone'
import 'react-international-phone/style.css'

interface ActivationFormProps {
  tagId: string
  onActivation: () => void
}

export function ActivationForm({ tagId, onActivation }: ActivationFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    pin: "",
    confirmPin: "",
    emergencyContacts: [{ name: "", phone: "", relationship: "Emergency Contact", customRelationship: "" }],
    medicalNotes: "",
    insuranceInfo: "",
    additionalNotes: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Custom country order: USA first, then Philippines, then alphabetical
  const getCustomCountries = () => {
  const countries = defaultCountries.filter((country) => {
    const { iso2 } = parseCountry(country)
    return iso2 !== 'us' && iso2 !== 'ca' && iso2 !== 'ph'
  })
  
  // Sort remaining countries alphabetically by name
  countries.sort((a, b) => {
    const countryA = parseCountry(a)
    const countryB = parseCountry(b)
    return countryA.name.localeCompare(countryB.name)
  })
  
  // Find US, Canada, and Philippines
  const usCountry = defaultCountries.find((country) => {
    const { iso2 } = parseCountry(country)
    return iso2 === 'us'
  })
  
  const caCountry = defaultCountries.find((country) => {
    const { iso2 } = parseCountry(country)
    return iso2 === 'ca'
  })
  
  const phCountry = defaultCountries.find((country) => {
    const { iso2 } = parseCountry(country)
    return iso2 === 'ph'
  })
  
  // Return with US first, Canada second, Philippines third, then alphabetical
  return [usCountry, caCountry, phCountry, ...countries].filter(Boolean)
}

  const addContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [...formData.emergencyContacts, { name: "", phone: "", relationship: "Emergency Contact", customRelationship: "" }],
    })
  }

  const removeContact = (index: number) => {
    if (formData.emergencyContacts.length > 1) {
      setFormData({
        ...formData,
        emergencyContacts: formData.emergencyContacts.filter((_, i) => i !== index),
      })
    }
  }

  const updateContact = (index: number, field: string, value: string) => {
    const updatedContacts = [...formData.emergencyContacts]
    updatedContacts[index] = { ...updatedContacts[index], [field]: value }
    setFormData({ ...formData, emergencyContacts: updatedContacts })
  }

  const validatePhoneNumber = (phone: string) => {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, "")
    
    // Check if it starts with + and has country code
    if (!cleanPhone.startsWith('+')) {
      return false
    }
    
    // Check length (should be between 7-15 digits after country code)
    const digitsOnly = cleanPhone.substring(1) // Remove the +
    return digitsOnly.length >= 7 && digitsOnly.length <= 15
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    //console.log("Starting tag activation for:", tagId)

    if (!isFirebaseAvailable()) {
      setError("Firebase is not configured. Please set up Firebase to activate tags.")
      return
    }

    if (!formData.fullName) {
      setError("Please enter your full name")
      return
    }

    if (formData.pin !== formData.confirmPin) {
      setError("PINs do not match")
      return
    }

    if (formData.pin.length !== 4 || !/^\d{4}$/.test(formData.pin)) {
      setError("PIN must be exactly 4 digits")
      return
    }

    if (formData.emergencyContacts.some(contact => !contact.name || !contact.phone)) {
      setError("Please fill in all required fields for emergency contacts")
      return
    }

    if (formData.emergencyContacts.some(contact => contact.relationship === "Other" && !contact.customRelationship)) {
      setError("Please provide a custom relationship for contacts marked as 'Other'")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return
    }

    // Validate phone numbers using the new validation
    for (let index = 0; index < formData.emergencyContacts.length; index++) {
      const contact = formData.emergencyContacts[index]
      if (!validatePhoneNumber(contact.phone)) {
        setError(`Invalid phone number format for contact ${contact.name || index + 1}. Please ensure it includes the country code (e.g., +1 234 567 8900).`)
        return
      }
    }

    try {
      setLoading(true)
      //console.log("Hashing PIN...")

      const pinHash = await hashPin(formData.pin)
      const now = new Date().toISOString()

      // Check if email already exists in Firestore
      //console.log("Checking if email exists in Firestore:", formData.email)
      const q = query(collection(db!, "tags"), where("ownerEmail", "==", formData.email))
      const querySnapshot = await getDocs(q)
      const isEmailRegistered = !querySnapshot.empty

      const tagData = {
        tagId,
        activated: true,
        createdAt: now,
        ownerEmail: formData.email,
        fullName: formData.fullName,
        pinHash,
        emergencyContacts: formData.emergencyContacts.map(contact => ({
          name: contact.name,
          phone: contact.phone,
          relationship: contact.relationship === "Other" ? contact.customRelationship : contact.relationship,
        })),
        medicalNotes: formData.medicalNotes,
        insuranceInfo: formData.insuranceInfo,
        additionalNotes: formData.additionalNotes,
        analytics: {
          tapCount: 0,
          lastTapped: now,
        },
      }

      //console.log("Saving tag data to Firebase...")
      await setDoc(doc(db!, "tags", tagId), tagData)
      //console.log("Tag data saved successfully")

      setSuccess("Tag activated successfully! Setting up email notifications...")

      let emailSuccess = false
      let emailMessage = ""

      try {
        //console.log("Sending activation email...")
        await fetch("/api/email/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, name: formData.fullName, tagId }),
        });
        //console.log("Activation email sent successfully")

        if (!isEmailRegistered) {
          //console.log("Sending welcome email for new subscriber...")
          await fetch("/api/email/welcome", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email, name: formData.fullName, tagId }),
          });
          //console.log("Welcome email sent successfully")
        } else {
          //console.log("Skipping welcome email for existing subscriber")
        }

        emailSuccess = true
        emailMessage = isEmailRegistered
          ? "Activation email sent successfully!"
          : "Welcome and activation emails sent successfully!"
      } catch (emailError: any) {
        console.error("Email integration error:", emailError)
        emailSuccess = false
        emailMessage = `Email service issue: ${emailError.message}. Tag activation completed.`
      }

      setSuccess(`🎉 Tag activated successfully! ${emailMessage}`)

      trackEvent("tag_activated", {
        tag_id: tagId,
        owner_email: formData.email,
        email_success: emailSuccess,
      })

      //console.log("Tag activation completed successfully")

      setTimeout(() => {
        onActivation()
      }, 3000)
    } catch (err: any) {
      console.error("Error activating tag:", err)
      setError(`Failed to activate tag: ${err.message || "Unknown error"}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  if (!isFirebaseAvailable()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white shadow-xl rounded-xl p-8 overflow-auto">
          <div className="text-center mb-6">
            <Image
              src="/logo.png"
              alt="TapMeSaveMe Logo"
              width={160}
              height={56}
              className="mx-auto mb-3"
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Required</h1>
            <p className="text-base text-gray-600">
              Tag ID: <span className="font-mono font-semibold">{tagId}</span>
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
            <h3 className="font-semibold text-base mb-1">Firebase Configuration Missing</h3>
            <p className="text-sm">To activate tags, you need to set up Firebase first.</p>
          </div>

          <div className="text-sm text-gray-600 space-y-3">
            <h3 className="font-semibold text-gray-900 text-base">Quick Setup Guide:</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                Go to{" "}
                <a
                  href="https://console.firebase.google.com"
                  className="text-blue-600 underline hover:text-blue-800 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Firebase Console
                </a>
              </li>
              <li>Create a new project or select existing one</li>
              <li>Enable Firestore Database</li>
              <li>Go to Project Settings → General → Your apps</li>
              <li>Copy the Firebase configuration</li>
              <li>Add to your .env.local file</li>
              <li>Restart your development server</li>
            </ol>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs font-mono">
              <p className="font-semibold mb-1">Add to .env.local:</p>
              <p>NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key</p>
              <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com</p>
              <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id</p>
              <p>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com</p>
              <p>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id</p>
              <p>NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white shadow-xl rounded-xl p-8 overflow-auto">
        <div className="text-center mb-6">
          <Image
            src="/logo.png"
            alt="TapMeSaveMe Logo"
            width={160}
            height={56}
            className="mx-auto mb-3"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activate Your TapMeSaveMe™ Tag</h1>
          <p className="text-base text-gray-600">
            Tag ID: <span className="font-mono font-semibold">{tagId}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Please fill in your emergency information below to activate your tag.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Private 4-Digit PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
              required
              maxLength={4}
              placeholder="1234"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              This PIN will be required to edit your information
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              value={formData.confirmPin}
              onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value })}
              required
              maxLength={4}
              placeholder="1234"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">Re-enter your 4-digit PIN to confirm</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              placeholder="John Doe"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              If activating a pet product, enter your pet's name here
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Your Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="your@email.com"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              We'll send you a welcome email and keep you updated about your tag
            </p>
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Emergency Contacts</h2>
            {formData.emergencyContacts.map((contact, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-5 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900 text-base">
                    {index === 0 ? "Emergency Contact" : `Emergency Contact #${index + 1}`}
                    {index === 0 && <span className="text-red-500"> *</span>}
                  </h3>
                  {formData.emergencyContacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="text-red-600 hover:text-red-800 transition-all hover:scale-105"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name {index === 0 && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      value={contact.name}
                      onChange={(e) => updateContact(index, "name", e.target.value)}
                      required={index === 0}
                      placeholder="John Doe"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number {index === 0 && <span className="text-red-500">*</span>}
                    </label>
                    <div className="mt-1">
                      <PhoneInput
                        defaultCountry="us"
                        value={contact.phone}
                        onChange={(phone) => updateContact(index, "phone", phone)}
                        disabled={loading}
                        countries={getCustomCountries()}
                        style={{
                          '--react-international-phone-border-radius': '6px',
                          '--react-international-phone-border-color': '#d1d5db',
                          '--react-international-phone-background-color': '#ffffff',
                          '--react-international-phone-text-color': '#374151',
                          '--react-international-phone-selected-dropdown-item-background-color': '#dbeafe',
                          '--react-international-phone-dropdown-item-background-color-hover': '#f3f4f6',
                          '--react-international-phone-height': '40px',
                          fontSize: '14px',
                        }}
                        inputStyle={{
                          width: '100%',
                          height: '40px',
                          fontSize: '14px',
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          transition: 'all 0.2s',
                        }}
                        countrySelectorStyleProps={{
                          buttonStyle: {
                            height: '40px',
                            paddingLeft: '12px',
                            paddingRight: '8px',
                            border: '1px solid #d1d5db',
                            borderRight: 'none',
                            borderRadius: '6px 0 0 6px',
                            backgroundColor: '#ffffff',
                          },
                          dropdownStyleProps: {
                            style: {
                              position: 'absolute',
                              top: '100%',
                              left: '0',
                              right: '0',
                              marginTop: '4px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              backgroundColor: '#ffffff',
                              zIndex: 9999,
                              width: '100%',
                              minWidth: '280px',
                            }
                          }
                        }}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">Relationship</label>
                  <select
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    value={contact.relationship}
                    onChange={(e) => updateContact(index, "relationship", e.target.value)}
                    disabled={loading}
                  >
                    <option value="Emergency Contact">Emergency Contact</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Other">Other</option>
                  </select>
                  {contact.relationship === "Other" && (
                    <input
                      type="text"
                      className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                      value={contact.customRelationship}
                      onChange={(e) => updateContact(index, "customRelationship", e.target.value)}
                      placeholder="Specify relationship"
                      disabled={loading}
                    />
                  )}
                </div>
              </div>
            ))}
            {formData.emergencyContacts.length > 0 && (
              <button
                type="button"
                onClick={addContact}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none disabled:bg-blue-400 text-base flex items-center justify-center gap-2"
                disabled={loading}
              >
                <Plus className="w-5 h-5" />
                Add Another Contact
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Medical Conditions or Allergies (Optional)</label>
            <textarea
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              value={formData.medicalNotes}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              placeholder="Allergies, medical conditions, medications, blood type, etc."
              disabled={loading}
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-1">
              Include any medical information that could assist in an emergency
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Insurance Information (Optional)</label>
            <textarea
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              value={formData.insuranceInfo}
              onChange={(e) => setFormData({ ...formData, insuranceInfo: e.target.value })}
              placeholder="Insurance provider, policy number, contact details, etc."
              disabled={loading}
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-1">
              Provide insurance details for medical billing or coverage
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
            <textarea
              className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              placeholder="Any other relevant information for emergency responders"
              disabled={loading}
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-1">
              Include any additional details relevant to emergencies
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none disabled:bg-blue-400 text-base"
            disabled={loading}
          >
            {loading ? "Activating Tag..." : "Activate Tag"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>By activating this tag, you agree to our terms of service and privacy policy.</p>
          <p className="mt-2">Your information will be stored securely and only displayed in emergency situations.</p>
        </div>
      </div>
    </div>
  )
}