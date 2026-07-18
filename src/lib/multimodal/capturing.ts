/**
 * Multimodal Task Capture System
 * Handles voice-to-text, image-to-task, and email-to-task conversion
 */

import { pipeline } from '@xenova/transformers';
import { spawn } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(require('child_process').execFile);

export interface VoiceCaptureOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface ImageToTaskResult {
  extractedText: string;
  structuredContent: {
    tasks: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      estimatedMinutes: number;
      category: string;
    }>;
    entities: string[];
    relationships: Array<{ subject: string; predicate: string; object: string }>;
  };
}

export interface EmailToTaskResult {
  extractedTasks: Array<{
    title: string;
    description: string;
    dueDate?: string;
    priority: 'high' | 'medium' | 'low';
    estimatedMinutes: number;
    category: string;
  }>;
  meetingInfo?: {
    title: string;
    dateTime: string;
    participants: string[];
  };
}

export class MultimodalCapture {
  private voiceRecognizer?: any;
  private textExtractor?: any;

  /**
   * Capture voice and convert to task
   */
  async captureVoice(options: VoiceCaptureOptions = {}): Promise<{ text: string; confidence: number }> {
    try {
      // Create voice recognition instance (placeholder for Web Speech API)
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = options.language || 'en-US';
      recognition.continuous = options.continuous || false;
      recognition.interimResults = options.interimResults || false;

      return await new Promise((resolve, reject) => {
        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          const confidence = event.results[event.results.length - 1][0].confidence || 0.9;
          resolve({ text: transcript, confidence });
        };

        recognition.onerror = (error: any) => reject(error);
        recognition.start();

        // Auto-stop after 10 seconds if no result
        setTimeout(() => {
          recognition.stop();
          reject(new Error('Timeout'));
        }, 10000);
      });
    } catch (error) {
      console.error('Voice capture error:', error);
      throw new Error('Voice capture failed: ' + (error as Error).message);
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractTextFromImage(imageBase64: string): Promise<string> {
    try {
      // Use Tesseract.js for OCR
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 })
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Image OCR error:', error);
      return '';
    }
  }

  /**
   * Convert text to structured task
   */
  async textToTask(text: string): Promise<Partial<any>> {
    try {
      // Use AI to parse and structure text into task
      const response = await fetch('/api/ai/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Text parsing failed');
      }

      const data = await response.json();
      return data.task;
    } catch (error) {
      console.error('Text to task error:', error);
      // Fallback to simple parsing
      return this.fallbackTextToTask(text);
    }
  }

  /**
   * Process email and extract tasks
   */
  async processEmail(emailContent: string, subject?: string): Promise<EmailToTaskResult> {
    try {
      const response = await fetch('/api/email/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent, subject })
      });

      if (!response.ok) {
        throw new Error('Email processing failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Email processing error:', error);
      return this.fallbackProcessEmail(emailContent, subject);
    }
  }

  /**
   * Extract and structure tasks from image
   */
  async imageToTask(imageBase64: string): Promise<ImageToTaskResult> {
    try {
      // Get OCR text
      const text = await this.extractTextFromImage(imageBase64);
      if (!text) {
        return { extractedText: '', structuredContent: { tasks: [], entities: [], relationships: [] } };
      }

      // Parse structured content from OCR text
      const structuredContent = await this.parseImageContent(text);

      return { extractedText: text, structuredContent };
    } catch (error) {
      console.error('Image to task error:', error);
      return { extractedText: '', structuredContent: { tasks: [], entities: [], relationships: [] } };
    }
  }

  /**
   * Full multimodal processing for voice input
   */
  async processVoiceInput(options: VoiceCaptureOptions = {}): Promise<Partial<any>> {
    try {
      // Capture voice
      const voiceResult = await this.captureVoice(options);

      // Convert to task
      const task = await this.textToTask(voiceResult.text);

      return {
        ...task,
        source: 'voice',
        confidence: voiceResult.confidence,
        metadata: {
          timestamp: new Date().toISOString(),
          inputLength: voiceResult.text.length,
          language: options.language || 'en-US',
        }
      };
    } catch (error) {
      console.error('Voice processing error:', error);
      throw error;
    }
  }

  /**
   * Full multimodal processing for image input
   */
  async processImageInput(imageBase64: string): Promise<any[]> {
    try {
      // Extract and parse image
      const imageResult = await this.imageToTask(imageBase64);

      // Convert each extracted task to task format
      return await Promise.all(
        imageResult.structuredContent.tasks.map(task => this.createTaskFromTemplate(task))
      );
    } catch (error) {
      console.error('Image processing error:', error);
      throw error;
    }
  }

  /**
   * Full multimodal processing for email input
   */
  async processEmailInput(emailContent: string, subject?: string): Promise<any[]> {
    try {
      // Parse email
      const emailResult = await this.processEmail(emailContent, subject);

      // Convert extracted tasks to task format
      return await Promise.all(
        emailResult.extractedTasks.map(task => this.createTaskFromTemplate(task))
      );
    } catch (error) {
      console.error('Email processing error:', error);
      throw error;
    }
  }

  /**
   * Fallback text to task parsing
   */
  private fallbackTextToTask(text: string): Partial<any> {
    const result: Partial<any> = {
      title: text,
      description: text,
      priority: 'medium',
      estimatedMinutes: 30,
      category: 'general',
      source: 'manual',
    };

    // Extract priority
    if (/important|urgent|asap|critical|high/i.test(text)) {
      result.priority = 'high';
    } else if (/low priority|not urgent|can wait/i.test(text)) {
      result.priority = 'low';
    }

    // Extract estimated time
    const timeMatch = text.match(/(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i);
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      result.estimatedMinutes = unit.startsWith('h') ? value * 60 : value;
    }

    return result;
  }

  /**
   * Fallback email processing
   */
  private fallbackProcessEmail(emailContent: string, subject?: string): EmailToTaskResult {
    const tasks: EmailToTaskResult['extractedTasks'] = [];
    const lines = emailContent.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.includes(':')) {
        const [action, description] = line.split(':').map(s => s.trim());
        if (action.toLowerCase() in ['follow up', 'review', 'respond', 'schedule', 'prepare', 'create']) {
          tasks.push({
            title: action.charAt(0).toUpperCase() + action.slice(1) + ' ' + description,
            description: description,
            priority: action.toLowerCase().includes('urgent') || action.toLowerCase().includes('important') ? 'high' : 'medium',
            estimatedMinutes: 15,
            category: 'email',
          });
        }
      }
    });

    if (tasks.length === 0) {
      tasks.push({
        title: subject || 'Action from email',
        description: emailContent,
        priority: 'medium',
        estimatedMinutes: 30,
        category: 'email',
      });
    }

    return { extractedTasks: tasks };
  }

  /**
   * Parse image content using AI
   */
  private async parseImageContent(text: string): Promise<ImageToTaskResult['structuredContent']> {
    try {
      const response = await fetch('/api/ai/parse-image-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Image content parsing failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Parse image content error:', error);
      return {
        tasks: [],
        entities: [],
        relationships: []
      };
    }
  }

  /**
   * Create task from template
   */
  private async createTaskFromTemplate(template: any): Promise<Partial<any>> {
    const result: Partial<any> = {
      title: template.title,
      description: template.description || '',
      priority: template.priority || 'medium',
      estimatedMinutes: template.estimatedMinutes || 30,
      category: template.category || 'general',
      source: 'multimodal',
    };

    // Add metadata
    return {
      ...result,
      metadata: {
        source: 'multimodal',
        timestamp: new Date().toISOString(),
        processedBy: 'AI',
      }
    };
  }
}

// Singleton instance
export const multimodalCapture = new MultimodalCapture();