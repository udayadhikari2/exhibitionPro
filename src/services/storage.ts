import fs from 'fs';
import path from 'path';
import { IProjectFile } from '@/types';

export interface StorageProvider {
  saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<IProjectFile>;
}

class LocalDiskStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      try {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      } catch (e) {
        // Safe ignore
      }
    }
  }

  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<IProjectFile> {
    const ext = path.extname(originalName).toLowerCase();
    const cleanBase = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^\w-]/g, '_');
    const uniqueName = `${Date.now()}_${cleanBase}${ext}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    await fs.promises.writeFile(filePath, buffer);

    let type: 'image' | 'pdf' | 'presentation' | 'other' = 'other';
    if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(originalName)) {
      type = 'image';
    } else if (mimeType === 'application/pdf' || /\.pdf$/i.test(originalName)) {
      type = 'pdf';
    } else if (
      mimeType.includes('presentation') ||
      mimeType.includes('powerpoint') ||
      /\.(ppt|pptx|key)$/i.test(originalName)
    ) {
      type = 'presentation';
    }

    return {
      name: originalName,
      url: `/uploads/${uniqueName}`,
      type,
      size: buffer.length,
    };
  }
}

// Fallback in-memory/mock provider if filesystem is read-only (e.g. serverless environments)
class MemoryStorageProvider implements StorageProvider {
  async saveFile(buffer: Buffer, originalName: string, mimeType: string): Promise<IProjectFile> {
    let type: 'image' | 'pdf' | 'presentation' | 'other' = 'other';
    if (mimeType.startsWith('image/')) type = 'image';
    else if (mimeType.includes('pdf')) type = 'pdf';
    else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) type = 'presentation';

    // If small enough, base64 data URI, otherwise mock static link
    const base64 = buffer.length < 500000 ? `data:${mimeType};base64,${buffer.toString('base64')}` : `/mock-uploads/${Date.now()}_${originalName}`;

    return {
      name: originalName,
      url: base64,
      type,
      size: buffer.length,
    };
  }
}

let activeStorageProvider: StorageProvider = new LocalDiskStorageProvider();

export function getStorageProvider(): StorageProvider {
  return activeStorageProvider;
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<IProjectFile> {
  try {
    return await activeStorageProvider.saveFile(buffer, filename, mimeType);
  } catch (err) {
    // Fallback to memory provider
    const fallback = new MemoryStorageProvider();
    return await fallback.saveFile(buffer, filename, mimeType);
  }
}
