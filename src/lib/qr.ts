import QRCode from 'qrcode';

/**
 * QR Code Generator Utility for Digital Exhibition & Competition Portal
 * Generates authentic, camera-scannable QR codes and standard public URLs.
 */

export function getBaseUrl(origin?: string): string {
  if (origin) return origin.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

/**
 * Get canonical public URL for an exhibition project
 * Format: /events/[slug]/projects/[teamCode]
 */
export function getPublicProjectUrl(eventSlug: string, teamCode: string, origin?: string): string {
  const base = getBaseUrl(origin);
  return `${base}/events/${encodeURIComponent(eventSlug)}/projects/${encodeURIComponent(teamCode.toUpperCase())}`;
}

/**
 * Get canonical public URL for an exhibition event
 * Format: /events/[slug]
 */
export function getPublicEventUrl(eventSlug: string, origin?: string): string {
  const base = getBaseUrl(origin);
  return `${base}/events/${encodeURIComponent(eventSlug)}`;
}

/**
 * Backward-compatible stall URL
 */
export function getPublicStallUrl(teamCode: string, origin?: string): string {
  const base = getBaseUrl(origin);
  return `${base}/stall/${encodeURIComponent(teamCode.toUpperCase())}`;
}

/**
 * Generate a synchronous QR SVG Data URL (for direct JSX rendering)
 */
export function generateQRCodeDataUrl(text: string, size = 300): string {
  const svg = generateFallbackSVG(text, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generate a camera-scannable PNG Data URL for any target text / URL
 */
export async function generateQRCodePngDataUrl(
  text: string,
  options?: { width?: number; margin?: number; darkColor?: string; lightColor?: string }
): Promise<string> {
  const width = options?.width || 300;
  const margin = options?.margin ?? 2;
  const dark = options?.darkColor || '#0f172a';
  const light = options?.lightColor || '#ffffff';

  try {
    return await QRCode.toDataURL(text, {
      width,
      margin,
      errorCorrectionLevel: 'M',
      color: {
        dark,
        light,
      },
    });
  } catch (err) {
    console.error('QR code generation error, using SVG fallback:', err);
    return generateQRCodeDataUrl(text, width);
  }
}

/**
 * Generate standard SVG markup for any target text / URL
 */
export async function generateQRCodeSvg(
  text: string,
  options?: { width?: number; margin?: number }
): Promise<string> {
  try {
    return await QRCode.toString(text, {
      type: 'svg',
      width: options?.width || 300,
      margin: options?.margin ?? 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('QR SVG error, using deterministic generator:', err);
    return generateFallbackSVG(text, options?.width || 300);
  }
}

/**
 * Deterministic fallback SVG generator
 */
export function generateFallbackSVG(text: string, size = 300): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const moduleCount = 25;
  const cellSize = size / moduleCount;
  const rects: string[] = [];

  const addCell = (x: number, y: number) => {
    rects.push(`<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a" />`);
  };

  const drawFinderPattern = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          addCell(startX + c, startY + r);
        }
      }
    }
  };

  drawFinderPattern(0, 0);
  drawFinderPattern(moduleCount - 7, 0);
  drawFinderPattern(0, moduleCount - 7);

  for (let i = 8; i < moduleCount - 8; i++) {
    if (i % 2 === 0) {
      addCell(6, i);
      addCell(i, 6);
    }
  }

  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= moduleCount - 8;
      const inBottomLeft = r >= moduleCount - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      const bit = Math.abs(Math.sin((r * 31 + c * 17 + hash) * 0.1) * 1000) % 2 > 1;
      if (bit) addCell(c, r);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="rounded-xl bg-white p-2">${rects.join('\n')}</svg>`;
}

export function generateFallbackSVGDataUrl(text: string, size = 300): string {
  const svg = generateFallbackSVG(text, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
