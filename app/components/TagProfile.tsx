"use client"

import { useState, useEffect, useRef } from "react"
import { doc, getDoc, runTransaction } from "firebase/firestore"
import { db, isFirebaseAvailable } from "../lib/firebase"
import { ActivationForm } from "./ActivationForm"
import { PublicProfile } from "./PublicProfile"
import { EditForm } from "./EditForm"
import { trackEvent } from "../lib/analytics"
import Image from "next/image"

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

interface TagProfileProps {
  tagId: string
}

export function TagProfile({ tagId }: TagProfileProps) {
  const [tagData, setTagData] = useState<TagData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const sessionIdRef = useRef(`${Date.now()}-${Math.random()}`)
  const instanceIdRef = useRef(`${Date.now()}-${Math.random()}`)
  const renderCountRef = useRef(0)
  const isHydratingRef = useRef(typeof window === "undefined")

  renderCountRef.current += 1

  useEffect(() => {
    const pageLoadKey = `tapCountLock:${tagId}`
    let hasUpdated = false
    if (typeof window !== "undefined") {
      const lockData = sessionStorage.getItem(pageLoadKey)
      if (lockData) {
        const { timestamp } = JSON.parse(lockData)
        if (Date.now() - timestamp < 1000) {
          hasUpdated = true
        }
      }
    }

    if (!hasUpdated) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          pageLoadKey,
          JSON.stringify({ sessionId: sessionIdRef.current, timestamp: Date.now() })
        )
      }
      loadTagData()
    } else {
      loadTagData(true)
    }

    const handleBeforeUnload = () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(pageLoadKey)
      }
    }

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }
      isHydratingRef.current = false
    }
  }, [tagId])

  const loadTagData = async (skipAnalyticsUpdate = false) => {
    try {
      setLoading(true)

      if (!isFirebaseAvailable()) {
        setLoading(false)
        return
      }

      const docRef = doc(db!, "tags", tagId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data() as TagData
        setTagData(data)

        if (!skipAnalyticsUpdate) {
          await runTransaction(db!, async (transaction) => {
            const freshSnap = await transaction.get(docRef)
            if (!freshSnap.exists()) {
              throw new Error("Document does not exist in transaction")
            }
            transaction.update(docRef, {
              "analytics.tapCount": freshSnap.data().analytics.tapCount + 1,
              "analytics.lastTapped": new Date().toISOString(),
            })
          })
          
          trackEvent("tag_viewed", {
            tag_id: tagId,
            activated: data.activated,
            session_id: sessionIdRef.current,
            instance_id: instanceIdRef.current,
          })
        }
      } else {
        setTagData(null)
        trackEvent("tag_not_found", {
          tag_id: tagId,
          session_id: sessionIdRef.current,
          instance_id: instanceIdRef.current,
        })
      }
    } catch (err: any) {
      console.error(`Error loading tag data for tag: ${tagId}, sessionId: ${sessionIdRef.current}, instanceId: ${instanceIdRef.current}`, err)
    } finally {
      setLoading(false)
    }
  }

  const handleActivation = () => {
    //console.log(`Tag activated, reloading data for tag: ${tagId}`)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`tapCountLock:${tagId}`)
    }
    sessionIdRef.current = `${Date.now()}-${Math.random()}`
    loadTagData()
  }

  const handleEdit = () => {
    //console.log(`Tag edited, reloading data for tag: ${tagId}`)
    setShowEdit(false)
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`tapCountLock:${tagId}`)
    }
    sessionIdRef.current = `${Date.now()}-${Math.random()}`
    loadTagData()
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-2rem)] bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white shadow-xl rounded-xl p-8 text-center overflow-auto">
          <Image
            src="/logo.png"
            alt="TapMeSaveMe Logo"
            width={160}
            height={56}
            className="mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto mb-4 transition-all"></div>
          <p className="text-base text-gray-600">Loading tag information...</p>
          <p className="text-sm text-gray-500 mt-1">
            Tag ID: <span className="font-mono font-semibold">{tagId}</span>
          </p>
        </div>
      </div>
    )
  }

  if (!tagData) {
    return <ActivationForm tagId={tagId} onActivation={handleActivation} />
  }

  if (showEdit) {
    return <EditForm tagId={tagId} tagData={tagData} onCancel={() => setShowEdit(false)} onSave={handleEdit} />
  }

  return <PublicProfile tagData={tagData} onEdit={() => setShowEdit(true)} />
}