import OpenAI from 'openai';
import { logger } from '../utils/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SpeechToTextResult {
  success: boolean;
  text?: string;
  error?: string;
  duration?: number;
}

interface TextToSpeechResult {
  success: boolean;
  audioBuffer?: Buffer;
  error?: string;
  audioUrl?: string;
}

class SpeechService {
  async speechToText(audioBuffer: Buffer): Promise<SpeechToTextResult> {
    try {
      logger.info('Processing speech-to-text conversion');

      // Create a Blob-like object from the buffer for OpenAI API
      const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/webm' });

      const transcription = await openai.audio.transcriptions.create({
        file: audioBlob as any,
        model: 'whisper-1',
        language: 'en', // Can be extended to support Swahili 'sw'
        response_format: 'json',
        temperature: 0.2
      });

      if (!transcription.text) {
        return {
          success: false,
          error: 'No transcription text returned'
        };
      }

      logger.info('Speech-to-text conversion successful');
      
      return {
        success: true,
        text: transcription.text,
        duration: 0 // Duration not available from OpenAI API response
      };

    } catch (error) {
      logger.error('Speech-to-text conversion failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transcription failed'
      };
    }
  }

  async textToSpeech(text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'): Promise<TextToSpeechResult> {
    try {
      logger.info('Processing text-to-speech conversion');

      // Limit text length to prevent excessive audio generation
      const maxLength = 4000;
      const processedText = text.length > maxLength 
        ? text.substring(0, maxLength) + '... For the complete response, please refer to the text version.'
        : text;

      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: processedText,
        response_format: 'mp3',
        speed: 1.0
      });

      const audioBuffer = Buffer.from(await mp3.arrayBuffer());

      logger.info('Text-to-speech conversion successful');

      return {
        success: true,
        audioBuffer
      };

    } catch (error) {
      logger.error('Text-to-speech conversion failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Audio generation failed'
      };
    }
  }

  // Validate audio format and size
  validateAudioInput(buffer: Buffer, maxSizeBytes: number = 25 * 1024 * 1024): { valid: boolean; error?: string } {
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'Empty audio buffer' };
    }

    if (buffer.length > maxSizeBytes) {
      return { valid: false, error: `Audio file too large. Maximum size is ${Math.round(maxSizeBytes / 1024 / 1024)}MB` };
    }

    // Check for common audio file signatures
    const audioSignatures = [
      [0xFF, 0xFB], // MP3
      [0xFF, 0xF3], // MP3
      [0xFF, 0xF2], // MP3
      [0x49, 0x44, 0x33], // MP3 with ID3
      [0x52, 0x49, 0x46, 0x46], // WAV/WebM (RIFF)
      [0x4F, 0x67, 0x67, 0x53], // OGG
      [0x66, 0x74, 0x79, 0x70], // M4A/MP4 (at offset 4)
    ];

    const hasValidSignature = audioSignatures.some(signature => {
      return signature.every((byte, index) => buffer[index] === byte) ||
             // Check M4A signature at offset 4
             (signature[0] === 0x66 && signature.every((byte, index) => buffer[index + 4] === byte));
    });

    if (!hasValidSignature) {
      return { valid: false, error: 'Unsupported audio format. Please use MP3, WAV, WebM, OGG, or M4A.' };
    }

    return { valid: true };
  }

  // Extract audio metadata if available
  async getAudioMetadata(buffer: Buffer): Promise<{
    duration?: number;
    format?: string;
    size: number;
  }> {
    try {
      // Basic metadata extraction
      const metadata = {
        size: buffer.length,
        format: this.detectAudioFormat(buffer)
      };

      return metadata;
    } catch (error) {
      logger.error('Error extracting audio metadata:', error);
      return { size: buffer.length };
    }
  }

  private detectAudioFormat(buffer: Buffer): string {
    // Simple format detection based on file signatures
    if (buffer.length < 4) return 'unknown';

    // Check MP3
    if (buffer[0] === 0xFF && (buffer[1] === 0xFB || buffer[1] === 0xF3 || buffer[1] === 0xF2)) {
      return 'mp3';
    }

    // Check for ID3 tag (MP3)
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      return 'mp3';
    }

    // Check WAV/WebM (RIFF)
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      // Check for WAVE format
      if (buffer.length > 11 && 
          buffer[8] === 0x57 && buffer[9] === 0x41 && buffer[10] === 0x56 && buffer[11] === 0x45) {
        return 'wav';
      }
      // Could be WebM
      return 'webm';
    }

    // Check OGG
    if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
      return 'ogg';
    }

    // Check M4A/MP4
    if (buffer.length > 7 && 
        buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
      return 'm4a';
    }

    return 'unknown';
  }

  // Convert speech to text with language detection
  async speechToTextWithLanguageDetection(audioBuffer: Buffer): Promise<SpeechToTextResult & { detectedLanguage?: string }> {
    try {
      // First, try without specifying language to let Whisper detect
      const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/webm' });

      const transcription = await openai.audio.transcriptions.create({
        file: audioBlob as any,
        model: 'whisper-1',
        response_format: 'verbose_json',
        temperature: 0.2
      });

      return {
        success: true,
        text: transcription.text,
        detectedLanguage: transcription.language,
        duration: 0 // Duration not available from OpenAI API response
      };

    } catch (error) {
      logger.error('Speech-to-text with language detection failed:', error);
      
      // Fallback to regular speech-to-text
      return await this.speechToText(audioBuffer);
    }
  }

  // Generate audio with different voices for different contexts
  async generateContextualAudio(text: string, context: 'legal_advice' | 'explanation' | 'greeting' = 'legal_advice'): Promise<TextToSpeechResult> {
    const voiceMap = {
      'legal_advice': 'nova', // Professional female voice
      'explanation': 'alloy', // Clear neutral voice
      'greeting': 'echo' // Friendly voice
    } as const;

    const selectedVoice = voiceMap[context];
    
    return await this.textToSpeech(text, selectedVoice);
  }
}

export const speechService = new SpeechService();