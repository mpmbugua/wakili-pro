import { customAlphabet } from 'nanoid';

/**
 * Generate a unique certificate ID
 * Format: PREFIX-YEAR-UNIQUEID (e.g., "WP-2024-ABC12345")
 */
export const generateCertificateId = (prefix: string = 'WP'): string => {
  const year = new Date().getFullYear();
  const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8); // Excluding similar looking chars
  const uniqueId = nanoid();
  
  return `${prefix}-${year}-${uniqueId}`;
};

/**
 * Validate certificate ID format
 */
export const isValidCertificateId = (certificateId: string): boolean => {
  const pattern = /^[A-Z]{2,4}-\d{4}-[A-Z0-9]{8}$/;
  return pattern.test(certificateId);
};

/**
 * Extract parts from certificate ID
 */
export const parseCertificateId = (certificateId: string): {
  prefix: string;
  year: number;
  uniqueId: string;
} | null => {
  if (!isValidCertificateId(certificateId)) {
    return null;
  }
  
  const [prefix, yearStr, uniqueId] = certificateId.split('-');
  return {
    prefix,
    year: parseInt(yearStr, 10),
    uniqueId
  };
};
