"use client"

import type React from "react"
import { useState } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { verifyPin, hashPin } from "../lib/utils"
import { trackEvent } from "../lib/analytics"
import { ArrowLeft, Save, Plus, Trash2, Lock } from "lucide-react"
import Image from "next/image"
import { PhoneInput, defaultCountries, parseCountry } from 'react-international-phone'
import 'react-international-phone/style.css'
import DownloadButtons from "@/components/ui/download-buttons"

interface TagData {
  tagId: string
  activated: boolean
  createdAt: string
  ownerEmail: string
  fullName: string
  pinHash: string
  emergencyContacts: Array<{
    name: string
    phone: string
    relationship: string
  }>
  medicalNotes: string
  insuranceInfo: string
  additionalNotes: string
  analytics: {
    tapCount: number
    lastTapped: string
  }
}

interface EditFormProps {
  tagId: string
  tagData: TagData
  onCancel: () => void
  onSave: () => void
}

export function EditForm({ tagId, tagData, onCancel, onSave }: EditFormProps) {
  const [step, setStep] = useState<"verify" | "edit" | "changePin">("verify")
  const [pin, setPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmNewPin, setConfirmNewPin] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    fullName: tagData.fullName || "",
    ownerEmail: tagData.ownerEmail || "",
    emergencyContacts: tagData.emergencyContacts.map(contact => ({
      ...contact,
      customRelationship: contact.relationship === "Other" ? contact.relationship : "",
    })),
    medicalNotes: tagData.medicalNotes,
    insuranceInfo: tagData.insuranceInfo || "",
    additionalNotes: tagData.additionalNotes || "",
  })

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

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      //console.log("Verifying PIN for tag:", tagId)
      const isValid = await verifyPin(pin, tagData.pinHash)

      if (isValid) {
        // console.log("PIN verification successful")
        setStep("edit")
        trackEvent("edit_access_granted", { tag_id: tagId })
      } else {
        //console.log("PIN verification failed")
        setError("Invalid PIN. Please try again.")
        trackEvent("edit_access_denied", { tag_id: tagId })
      }
    } catch (err: any) {
      console.error("PIN verification error:", err)
      setError("Failed to verify PIN. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      //console.log("Verifying old PIN for PIN change:", tagId)
      const isValid = await verifyPin(pin, tagData.pinHash)

      if (!isValid) {
        //console.log("Old PIN verification failed")
        setError("Invalid old PIN. Please try again.")
        setLoading(false)
        return
      }

      if (newPin !== confirmNewPin) {
        setError("New PINs do not match")
        setLoading(false)
        return
      }

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        setError("New PIN must be exactly 4 digits")
        setLoading(false)
        return
      }

      const newPinHash = await hashPin(newPin)
      await updateDoc(doc(db!, "tags", tagId), {
        pinHash: newPinHash,
      })

      // console.log("PIN updated successfully")
      setSuccess("PIN updated successfully!")
      trackEvent("pin_changed", { tag_id: tagId })

      setTimeout(() => {
        setStep("edit")
        setPin("")
        setNewPin("")
        setConfirmNewPin("")
      }, 1500)
    } catch (err: any) {
      console.error("Error changing PIN:", err)
      setError(`Failed to change PIN: ${err.message || "Unknown error"}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      //console.log("Updating tag information for:", tagId)

      if (!db) {
        setError("Database connection not available.")
        setLoading(false)
        return
      }

      if (!formData.fullName) {
        setError("Please enter your full name")
        setLoading(false)
        return
      }

      if (formData.emergencyContacts.some(contact => !contact.name || !contact.phone)) {
        setError("Please fill in all required fields for emergency contacts")
        setLoading(false)
        return
      }

      if (formData.emergencyContacts.some(contact => contact.relationship === "Other" && !contact.customRelationship)) {
        setError("Please provide a custom relationship for contacts marked as 'Other'")
        setLoading(false)
        return
      }

      // Validate phone numbers using the same validation as ActivationForm
      for (let index = 0; index < formData.emergencyContacts.length; index++) {
        const contact = formData.emergencyContacts[index]
        if (!validatePhoneNumber(contact.phone)) {
          setError(`Invalid phone number format for contact ${contact.name || index + 1}. Please ensure it includes the country code (e.g., +1 234 567 8900).`)
          setLoading(false)
          return
        }
      }

      await updateDoc(doc(db, "tags", tagId), {
        fullName: formData.fullName,
        emergencyContacts: formData.emergencyContacts.map(contact => ({
          name: contact.name,
          phone: contact.phone,
          relationship: contact.relationship === "Other" ? contact.customRelationship : contact.relationship,
        })),
        medicalNotes: formData.medicalNotes,
        insuranceInfo: formData.insuranceInfo,
        additionalNotes: formData.additionalNotes,
        "analytics.lastTapped": new Date().toISOString(),
      })

      //console.log("Tag information updated successfully")
      setSuccess("Information updated successfully!")
      trackEvent("tag_updated", { tag_id: tagId })

      setTimeout(() => {
        onSave()
      }, 1500)
    } catch (err: any) {
      console.error("Error updating tag:", err)
      setError(`Failed to update information: ${err.message || "Unknown error"}. Please try again.`)
    } finally {
      setLoading(false)
    }
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

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white shadow-xl rounded-xl p-8 overflow-auto">
          <div className="text-center mb-6">
            <Image
              src="/logo.png"
              alt="TapMeSaveMe Logo"
              width={160}
              height={56}
              className="mx-auto"
            />
            <div className="mb-5">
              <DownloadButtons />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Identity</h1>
            <p className="text-base text-gray-600">Enter your 4-digit PIN to edit tag information</p>
            <p className="text-sm text-gray-500 mt-1">
              Tag ID: <span className="font-mono font-semibold">{tagId}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyPin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                4-Digit PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-lg tracking-widest"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                placeholder="••••"
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">Enter the PIN you created when activating this tag</p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none disabled:bg-gray-100 flex items-center justify-center text-base"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none disabled:bg-blue-400 flex items-center justify-center text-base"
                disabled={loading || pin.length !== 4}
              >
                {loading ? "Verifying..." : "Verify PIN"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (step === "changePin") {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Change Your PIN</h1>
            <p className="text-base text-gray-600">Verify your old PIN and set a new 4-digit PIN</p>
            <p className="text-sm text-gray-500 mt-1">
              Tag ID: <span className="font-mono font-semibold">{tagId}</span>
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

          <form onSubmit={handleChangePin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Old PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-lg tracking-widest"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                placeholder="••••"
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">Enter your current 4-digit PIN</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                New PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-lg tracking-widest"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={4}
                placeholder="••••"
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">Enter a new 4-digit PIN</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm New PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-lg tracking-widest"
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                maxLength={4}
                placeholder="••••"
                required
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-1">Re-enter your new 4-digit PIN</p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                type="button"
                onClick={() => setStep("edit")}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none disabled:bg-gray-100 flex items-center justify-center text-base"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-non disabled:bg-blue-400 flex items-center justify-center text-base"
                disabled={loading || pin.length !== 4 || newPin.length !== 4 || confirmNewPin.length !== 4}
              >
                <Lock className="w-4 h-4 mr-2" />
                {loading ? "Changing PIN..." : "Change PIN"}
              </button>
            </div>
          </form>
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
            className="mx-auto"
          />
          <div className="mb-6">
            <DownloadButtons />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Emergency Information</h1>
          <p className="text-base text-gray-600">
            Tag ID: <span className="font-mono font-semibold">{tagId}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Update your emergency information below.
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

        <form onSubmit={handleSave} className="space-y-8">
          <div>
            <button
              type="button"
              onClick={() => setStep("changePin")}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium transition-all"
              disabled={loading}
            >
              <Lock className="w-4 h-4 mr-1" />
              Change PIN
            </button>
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
              If editing a pet product, enter your pet's name here
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


          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none disabled:bg-gray-100 flex items-center justify-center text-base"
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none disabled:bg-blue-400 flex items-center justify-center text-base"
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}