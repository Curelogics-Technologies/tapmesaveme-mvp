'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DownloadButtons() {
  return (
    <>
      <p className='text-sm mb-3 text-center text-gray-600'>Get the <b>TapMeSaveMe™</b> app for updates, lost-tag protection, and a two-month free trial of our <b>GPS + SMS</b> premium features.</p>
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Google Play */}
        <Link href="https://play.google.com/store/apps/details?id=com.tapmesaveme.app&pli=1" target="_blank" className='w-full'>
          <Button
            variant="outline"
            className="flex items-center gap-2 rounded-lg h-12 border-gray-400 bg-black text-white hover:bg-gray-100 hover:text-black w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" style={{ height: 32, width: 32 }} width="256" height="283" viewBox="0 0 256 283"><path fill="#ea4335" d="M119.553 134.916L1.06 259.061a32.14 32.14 0 0 0 47.062 19.071l133.327-75.934z" /><path fill="#fbbc04" d="M239.37 113.814L181.715 80.79l-64.898 56.95l65.162 64.28l57.216-32.67a31.345 31.345 0 0 0 0-55.537z" /><path fill="#4285f4" d="M1.06 23.487A30.6 30.6 0 0 0 0 31.61v219.327a32.3 32.3 0 0 0 1.06 8.124l122.555-120.966z" /><path fill="#34a853" d="m120.436 141.274l61.278-60.483L48.564 4.503A32.85 32.85 0 0 0 32.051 0C17.644-.028 4.978 9.534 1.06 23.399z" /></svg>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px]">GET IT ON</span>
              <span className="text-lg leading-6 font-semibold">Google Play</span>
            </div>
          </Button>
        </Link>

        {/* App Store */}
        <Link href="https://www.apple.com/app-store/" target="_blank" className='w-full'>
          <Button
            size={'lg'}
            variant="outline"
            className="flex items-center gap-2 rounded-lg h-12 border-gray-400 bg-black text-white hover:bg-gray-100 hover:text-black w-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" style={{ height: 32, width: 32 }} width="20" height="24" viewBox="0 0 20 24"><path fill="currentColor" d="M20.091 17.524a13.9 13.9 0 0 1-1.805 3.651l.03-.046q-1.861 2.827-3.706 2.827a6.7 6.7 0 0 1-2.064-.478l.044.016a6.3 6.3 0 0 0-2.167-.461h-.011a5.5 5.5 0 0 0-2.083.49l.035-.014a5.1 5.1 0 0 1-1.889.49L6.46 24q-2.192 0-4.342-3.735a14.6 14.6 0 0 1-2.12-7.236v-.02A8.52 8.52 0 0 1 1.644 7.59l-.017.024a5 5 0 0 1 4.061-2.08h.037h-.002a9.6 9.6 0 0 1 2.621.452l-.068-.019a9 9 0 0 0 1.95.428l.041.004a7.2 7.2 0 0 0 2.111-.508l-.048.017a8 8 0 0 1 2.48-.49h.085a5.25 5.25 0 0 1 3.019.949l-.017-.011q.857.624 1.488 1.424l.012.016a9.5 9.5 0 0 0-1.627 1.678l-.017.024a5.1 5.1 0 0 0-.938 2.958v.029v-.001v.062c0 1.181.373 2.275 1.007 3.171l-.012-.017a4.4 4.4 0 0 0 2.248 1.814l.031.01zM14.668.606a5.5 5.5 0 0 1-.432 1.998l.014-.036a5.9 5.9 0 0 1-1.34 1.992l-.001.001a4.1 4.1 0 0 1-1.53 1.031l-.028.009a7.7 7.7 0 0 1-1.475.243l-.025.001v-.028c0-1.372.42-2.647 1.139-3.701l-.015.023A5.75 5.75 0 0 1 14.547.005L14.581 0c.013.043.026.097.035.152l.001.008q.015.093.039.17l-.003-.01q0 .058.007.144t.007.142z" /></svg>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px]">AVAILABLE ON</span>
              <span className="text-lg leading-6 font-semibold">App Store</span>
            </div>
          </Button>
        </Link>
      </div>
    </>
  );
}
