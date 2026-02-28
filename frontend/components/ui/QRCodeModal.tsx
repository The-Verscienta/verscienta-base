'use client';

import { useState, useCallback } from 'react';
import QRCode from 'react-qr-code';

interface QRCodeModalProps {
  url?: string;
  title: string;
}

export function QRCodeModal({ url, title }: QRCodeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = pageUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [pageUrl]);

  const handleDownload = useCallback(() => {
    const svgEl = document.getElementById('qr-svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [title]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="no-print inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-earth-600 dark:text-earth-300 bg-earth-50 dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-lg hover:bg-earth-100 dark:hover:bg-earth-700 transition-colors"
        aria-label="Show QR code"
        title="QR Code / Share"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="3" height="3"/>
          <rect x="18" y="14" width="3" height="3"/>
          <rect x="14" y="18" width="3" height="3"/>
          <rect x="18" y="18" width="3" height="3"/>
        </svg>
        QR
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className="bg-white dark:bg-earth-900 rounded-2xl shadow-2xl border border-earth-200 dark:border-earth-700 p-8 max-w-sm w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-earth-100">Share</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-earth-200 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <p className="text-sm text-earth-600 dark:text-earth-300 mb-4 font-medium truncate">{title}</p>

            <div className="flex justify-center bg-white p-4 rounded-xl border border-earth-100 mb-6">
              <QRCode
                id="qr-svg"
                value={pageUrl}
                size={180}
                level="M"
              />
            </div>

            <p className="text-xs text-earth-500 dark:text-earth-400 text-center mb-6 break-all">{pageUrl}</p>

            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-earth-600 dark:text-earth-300 bg-earth-50 dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-lg hover:bg-earth-100 dark:hover:bg-earth-700 transition-colors"
                title="Download SVG"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                SVG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
