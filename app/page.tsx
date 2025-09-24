"use client"

import Link from "next/link"
import Image from "next/image"
import DownloadButtons from "@/components/ui/download-buttons"

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-2rem)] bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col">
      <div className="max-w-xl mx-auto px-4 py-4">
        <div className="text-center pt-4">
          <Image
            src="/logo.png"
            alt="TapMeSaveMe Logo"
            width={135}
            height={44}
            className="mx-auto"
          />
          <div className="w-4/5 mx-auto mb-4">
            <DownloadButtons />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">TapMeSaveMe™</h1>
          <p className="text-base text-gray-600 mb-4">Emergency NFC Profile System</p>

          <div className="bg-white rounded-xl shadow-xl p-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">How it works</h2>
            <div className="space-y-2 text-left">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <p className="text-gray-600 text-sm">Tap the product with your phone to begin activation.</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <p className="text-gray-600 text-sm">Activate your tag with emergency information</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <p className="text-gray-600 text-sm">Emergency contacts can access your info when needed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xl p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Test the System</h3>
            <p className="text-gray-600 text-sm mb-2">Try with a sample tag ID to see how it works</p>
            <Link
              href="/t/demo1298"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none text-base"
            >
              Try Demo Tag
            </Link>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Powered by TapMeSaveMe™ Emergency Response System</p>
          </div>
        </div>
      </div>
    </div>
  )
}