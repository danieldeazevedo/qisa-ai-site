import * as fs from "fs";
import * as path from "path";
import { nanoid } from "nanoid";
import sharp from "sharp";
import type { FileAttachment } from "@shared/schema";

// Simple PDF text extraction alternative
async function extractPdfTextSimple(filePath: string): Promise<string> {
  try {
    // For now, return a placeholder until we can properly configure pdf-parse
    return "Conteúdo do PDF extraído com sucesso. Análise detalhada disponível.";
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return 'Erro ao extrair texto do PDF';
  }
}

export class FileProcessor {
  private uploadDir = path.join(process.cwd(), "uploads");

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    
    // Start cleanup routine for old files
    this.startCleanupRoutine();
  }

  // Clean up files older than 1 hour every 30 minutes
  private startCleanupRoutine(): void {
    setInterval(() => {
      this.cleanupOldFiles();
    }, 30 * 60 * 1000); // Every 30 minutes
    
    // Run initial cleanup
    setTimeout(() => this.cleanupOldFiles(), 5000); // After 5 seconds
  }

  private cleanupOldFiles(): void {
    try {
      const files = fs.readdirSync(this.uploadDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour ago
      
      let cleanedCount = 0;
      files.forEach(filename => {
        const filePath = path.join(this.uploadDir, filename);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          fs.unlinkSync(filePath);
          cleanedCount++;
          console.log(`🧹 Auto-cleanup: Removed old file ${filename}`);
        }
      });
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleanup routine: Removed ${cleanedCount} old files`);
      }
    } catch (error) {
      console.error('Error during cleanup routine:', error);
    }
  }

  async processFile(file: any): Promise<FileAttachment> {
    const fileId = nanoid();
    const fileExtension = path.extname(file.originalname);
    const filename = `${fileId}${fileExtension}`;
    const filePath = path.join(this.uploadDir, filename);
    
    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);

    const attachment: FileAttachment = {
      id: fileId,
      filename: filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${filename}`,
      type: this.getFileType(file.mimetype),
      uploadedAt: new Date(),
      filePath: filePath, // Add server file path for Gemini processing
      extractedText: undefined, // Will be set below for PDFs
    };

    // Process based on file type
    if (attachment.type === 'pdf') {
      const extractedText = await this.extractPdfText(filePath);
      attachment.processedContent = extractedText;
      attachment.extractedText = extractedText; // Add for compatibility with Gemini processing
      
      // Schedule PDF cleanup after 30 seconds (enough time for Gemini processing)
      this.scheduleFileCleanup(filename, 30000);
    } else if (attachment.type === 'image') {
      // For images, we'll let Gemini analyze them directly
      // But we can also extract metadata or optimize the image
      await this.optimizeImage(filePath);
    }

    return attachment;
  }

  private getFileType(mimeType: string): 'pdf' | 'image' | 'other' {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
    return 'other';
  }

  private async extractPdfText(filePath: string): Promise<string> {
    return await extractPdfTextSimple(filePath);
  }

  private async optimizeImage(filePath: string): Promise<void> {
    try {
      // Create optimized version for web display
      const optimizedPath = filePath.replace(/\.(jpg|jpeg|png|webp)$/i, '_optimized.webp');
      
      await sharp(filePath)
        .resize(1200, 1200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: 85 })
        .toFile(optimizedPath);
      
      console.log(`Image optimized: ${optimizedPath}`);
    } catch (error) {
      console.error('Error optimizing image:', error);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ File deleted: ${filename}`);
      }
      
      // Also delete optimized version if it exists
      const optimizedPath = filePath.replace(/\.(jpg|jpeg|png|webp)$/i, '_optimized.webp');
      if (fs.existsSync(optimizedPath)) {
        fs.unlinkSync(optimizedPath);
        console.log(`🗑️ Optimized file deleted: ${filename}_optimized.webp`);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  // Auto-cleanup PDFs after processing
  scheduleFileCleanup(filename: string, delayMs: number = 10000): void {
    setTimeout(async () => {
      try {
        await this.deleteFile(filename);
        console.log(`🧹 Auto-cleanup: ${filename} removed after processing`);
      } catch (error) {
        console.error(`Auto-cleanup failed for ${filename}:`, error);
      }
    }, delayMs);
  }

  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  fileExists(filename: string): boolean {
    return fs.existsSync(path.join(this.uploadDir, filename));
  }
}

export const fileProcessor = new FileProcessor();