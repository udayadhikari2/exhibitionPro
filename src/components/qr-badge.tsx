'use client';

import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, Copy, Check, ExternalLink, QrCode, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QRBadgeProps {
  teamCode?: string;
  tableNumber?: string;
  stallNumber?: string;
  projectTitle?: string;
  teamName?: string;
  categoryName?: string;
  institution?: string;
  eventTitle?: string;
  eventSlug?: string;
  customUrl?: string;
  isEventQR?: boolean;
}

export default function QRBadge({
  teamCode,
  tableNumber,
  stallNumber,
  projectTitle,
  teamName,
  categoryName,
  institution,
  eventTitle,
  eventSlug,
  customUrl,
  isEventQR = false,
}: QRBadgeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const displayStall = stallNumber || tableNumber;

  // Derive target URL
  const targetUrl = React.useMemo(() => {
    if (customUrl) return customUrl;
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    if (isEventQR && eventSlug) {
      return `${origin}/events/${encodeURIComponent(eventSlug)}`;
    }
    if (eventSlug && teamCode) {
      return `${origin}/events/${encodeURIComponent(eventSlug)}/projects/${encodeURIComponent(teamCode)}`;
    }
    if (teamCode) {
      return `${origin}/stall/${encodeURIComponent(teamCode)}`;
    }
    return window.location.href;
  }, [customUrl, isEventQR, eventSlug, teamCode]);

  useEffect(() => {
    if (targetUrl) {
      QRCode.toDataURL(targetUrl, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(setQrDataUrl)
        .catch((err) => console.error('Failed to generate QR data URL:', err));
    }
  }, [targetUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = isEventQR
      ? `${eventSlug || 'event'}-qr.png`
      : `${teamCode || 'project'}-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = () => {
    if (!targetUrl) return;
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900">
            {isEventQR ? 'Event Gateway QR' : 'Official Booth Placard & QR'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copied' : 'Copy Link'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleDownload}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download PNG
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Placard
          </Button>
        </div>
      </div>

      {/* Printable Placard Card */}
      <div
        ref={printRef}
        className="bg-white border-2 border-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm max-w-md mx-auto text-center space-y-5 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-full"
      >
        {/* Header Ribbon */}
        <div className="border-b-2 border-slate-900/10 pb-4 space-y-1">
          <div className="text-[11px] font-black tracking-widest text-blue-600 uppercase">
            {eventTitle || 'Exhibition Official Showcase'}
          </div>

          {!isEventQR ? (
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                {displayStall ? `STALL ${displayStall}` : 'BOOTH ENTRY'}
              </div>
              {teamCode && (
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono font-black text-slate-700">
                  CODE: {teamCode}
                </div>
              )}
            </div>
          ) : (
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              EXHIBITION DIRECTORY &amp; VOTING
            </div>
          )}
        </div>

        {/* QR Code Container */}
        <div className="flex justify-center my-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-2xs">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${teamCode || eventTitle || 'Exhibition'}`}
              className="w-52 h-52 sm:w-60 sm:h-60 rounded-xl"
            />
          ) : (
            <div className="w-52 h-52 sm:w-60 sm:h-60 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
              Generating High-Res QR...
            </div>
          )}
        </div>

        {/* Project / Event Details */}
        <div className="pt-2 border-t-2 border-slate-900/10 space-y-2">
          {!isEventQR ? (
            <>
              {categoryName && (
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
                  {categoryName}
                </div>
              )}
              {projectTitle && (
                <div className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {projectTitle}
                </div>
              )}
              {teamName && (
                <div className="text-xs font-semibold text-slate-600">
                  Team: <span className="font-bold text-slate-900">{teamName}</span>
                  {institution && <span> &bull; {institution}</span>}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-1">
              <div className="text-base font-bold text-slate-900">
                Scan to Explore All Projects &amp; Stalls
              </div>
              <p className="text-xs text-slate-500">
                Instant smartphone access to project documentation, prototype gallery, and live results.
              </p>
            </div>
          )}

          <div className="pt-3">
            <p className="text-[10px] text-slate-400 font-medium leading-normal">
              Point your smartphone camera at the QR code to open the digital exhibition profile and leave visitor feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
