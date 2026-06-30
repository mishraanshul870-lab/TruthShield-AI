import fs from 'fs';
import pdf from 'pdf-parse';

/**
 * Extracts plain text from a PDF file.
 * @param {string} filePath - Absolute path to the PDF file.
 * @returns {Promise<string>} - Extracted text content.
 */
export const parsePdfText = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text || '';
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse text from the PDF file.');
  }
};
