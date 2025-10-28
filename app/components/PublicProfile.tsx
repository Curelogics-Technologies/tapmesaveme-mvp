"use client"

import DownloadButtons from "@/components/ui/download-buttons"
import { Phone, AlertCircle, Edit3, Eye, Calendar, Shield, User, Copy, Check, Users } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

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
  coManagers?: string[]
  getUpdatesByEmail?: boolean
  productType?: string
  status?: string
  tagName?: string
  ownerFcmTokens?: string[]
  coManagerFcmTokens?: string[]
}

interface PublicProfileProps {
  tagData: TagData
  onEdit: () => void
}

export function PublicProfile({ tagData, onEdit }: PublicProfileProps) {
  const [copiedItems, setCopiedItems] = useState<{ [key: string]: boolean }>({})
  const [notificationSent, setNotificationSent] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItems(prev => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const sendTapNotifications = async () => {
    if (notificationSent) return

    try {
      const now = new Date()
      const lastTapped = new Date(tagData.analytics.lastTapped)
      const timeDiff = now.getTime() - lastTapped.getTime()
      const twoMinutes = 0.5 * 60 * 1000

      if (timeDiff < twoMinutes) {
        setNotificationSent(true)
        return
      }

      const allFcmTokens = [
        ...(tagData.ownerFcmTokens || []),
        ...(tagData.coManagerFcmTokens || [])
      ].filter(Boolean)

      if (allFcmTokens.length === 0) {
        setNotificationSent(true)
        return
      }

      const response = await fetch('/api/send-notifications', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: allFcmTokens,
          tagId: tagData.tagId,
          fullName: tagData.fullName,
          tapCount: tagData.analytics.tapCount,
          tagName: tagData?.tagName || "",
        }),
      })

      const result = await response.json()
      console.log('📨 Server result:', result)
      
      if (result.success) {
        setNotificationSent(true)
      } else {
        console.warn('⚠️ Notification failed:', result.message)
        setNotificationSent(true)
      }

    } catch (error: any) {
      console.error('❌ Notification error:', error)
      setNotificationSent(true)
    }
  }

  useEffect(() => {
    if (tagData && tagData.ownerFcmTokens !== undefined && !notificationSent) {
      const timer = setTimeout(sendTapNotifications, 1000)
      return () => clearTimeout(timer)
    }
  }, [tagData, notificationSent])

  const CopyButton = ({ text, copyKey, className = "" }: { text: string, copyKey: string, className?: string }) => (
    <button
      onClick={() => copyToClipboard(text, copyKey)}
      className={`ml-2 p-1 rounded-md hover:bg-gray-200 transition-colors ${className}`}
      title="Copy to clipboard"
    >
      {copiedItems[copyKey] ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-gray-500" />
      )}
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center py-4">
      <div className="max-w-xl w-full bg-[#E2E2E3] shadow-xl rounded-xl p-8 overflow-auto">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <Image
            src="/logo.png"
            alt="TapMeSaveMe Logo"
            width={160}
            height={56}
            className="mx-auto"
          />
          <div className="pb-6">
            <DownloadButtons />
          </div>
          <div className="bg-red-600 text-white p-4 rounded-lg">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <h2 className="text-3xl font-bold mb-2">Emergency Information</h2>
            <div className="flex items-center justify-center">
              <p className="text-base text-red-100">
                Tag ID: <span className="font-mono font-semibold">{tagData.tagId}</span>
              </p>
              <CopyButton text={tagData.tagId} copyKey="tagId" className="hover:bg-red-700" />
            </div>
            <p className="text-sm text-red-200 mt-2">⚡ This is an active emergency profile</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <User className="w-4 h-4 mr-2 text-red-600" />
            Personal Information
          </h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-gray-800 text-sm font-medium">
                  Name: <span className="font-semibold">{tagData.fullName}</span>
                </p>
              </div>
              <CopyButton text={tagData.fullName} copyKey="fullName" />
            </div>
          </div>
        </div>

        {tagData.coManagers && tagData.coManagers.length > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2 text-red-600" />
              Co-Managers
            </h2>
            <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-5">
              <div className="space-y-2">
                {tagData.coManagers.map((email, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-md">
                    <span className="text-sm text-gray-800 font-medium">{email}</span>
                    <CopyButton text={email} copyKey={`co-manager-${index}`} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-600 mt-2">
                These users will receive emergency notifications
              </p>
            </div>
          </div>
        )}

        {/* Emergency Contacts */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <Phone className="w-4 h-4 mr-2 text-red-600" />
            Emergency Contacts
          </h2>
          <div className="space-y-3">
            {tagData.emergencyContacts.map((contact, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-5 border-l-4 border-red-500">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <h3 className="font-semibold text-gray-900 text-base">{contact.name}</h3>
                    <CopyButton text={contact.name} copyKey={`contact-name-${index}`} />
                  </div>
                  <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">{contact.relationship}</span>
                </div>
                <div className="flex items-center text-base text-gray-800">
                  <Phone className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="flex-1">{contact.phone}</span>
                  <CopyButton text={contact.phone} copyKey={`contact-phone-${index}`} />
                  <a
                    href={`tel:${contact.phone}`}
                    className="ml-2 bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 transition-colors"
                  >
                    Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Notes */}
        {tagData.medicalNotes && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
              Medical Information
            </h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-5">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-gray-800 whitespace-pre-wrap text-sm font-medium">{tagData.medicalNotes}</p>
                </div>
                <CopyButton text={tagData.medicalNotes} copyKey="medicalNotes" />
              </div>
            </div>
          </div>
        )}

        {/* Insurance Information */}
        {tagData.insuranceInfo && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-red-600" />
              Insurance Information
            </h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-5">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Shield className="h-4 w-4 text-blue-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-gray-800 whitespace-pre-wrap text-sm font-medium">{tagData.insuranceInfo}</p>
                </div>
                <CopyButton text={tagData.insuranceInfo} copyKey="insuranceInfo" />
              </div>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        {tagData.additionalNotes && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
              Additional Notes
            </h2>
            <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-5">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-gray-800 whitespace-pre-wrap text-sm font-medium">{tagData.additionalNotes}</p>
                </div>
                <CopyButton text={tagData.additionalNotes} copyKey="additionalNotes" />
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2 text-gray-600" />
                <span>Viewed {tagData.analytics.tapCount} times</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                <span>Created {formatDate(tagData.createdAt)}</span>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              Last accessed: {formatDateTime(tagData.analytics.lastTapped)}
            </div>
          </div>
        </div>

        {/* Edit Section */}
        <div className="border-t border-gray-200 p-5 bg-gray-50 rounded-lg">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Update Information</h3>
          <p className="text-gray-600 text-sm mb-3">
            Are you the owner of this tag? You can update the emergency information using your PIN.
          </p>
          <button
            onClick={onEdit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none text-base"
          >
            <Edit3 className="w-4 h-4 mr-2 inline-block" />
            Edit Information
          </button>
        </div>

        {/* Emergency Instructions */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-3">For Emergency Responders</h3>
          <div className="text-gray-600 text-sm space-y-2">
            <p>🚨 This person carries a TapMeSaveMe™ emergency tag</p>
            <p>📞 Contact information above is provided by the tag owner</p>
            <p>🏥 Medical information may be critical for treatment</p>
            <p>📅 Profile was last updated: {formatDateTime(tagData.analytics.lastTapped)}</p>
            <p>✅ This is a verified emergency profile</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by TapMeSaveMe™ Emergency Response System</p>
        </div>
      </div>
    </div>
  )
}