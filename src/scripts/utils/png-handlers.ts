// Very similar to https://github.com/SillyTavern/SillyTavern/blob/4fcad0752f6e03d4796cda9838f96604298e02e9/src/character-card-parser.js

import { Buffer } from 'buffer';
import encode from 'png-chunks-encode';
import extract from 'png-chunks-extract';
import PNGtext from 'png-chunk-text';
import { FullExportData } from '../types';

/**
 * Writes Character metadata to a PNG image buffer.
 * Writes only 'chara', 'ccv3' is not supported and removed not to create a mismatch.
 * @param image PNG image buffer
 * @param data Character data to write
 * @returns PNG image buffer with metadata
 */
export function writeScenarioToPng(image: ArrayBuffer, data: FullExportData): ArrayBuffer {
  const chunks = extract(new Uint8Array(image));
  const tEXtChunks = chunks.filter((chunk) => chunk.name === 'tEXt');

  // Remove existing tEXt chunks
  for (const tEXtChunk of tEXtChunks) {
    const chunkData = PNGtext.decode(tEXtChunk.data);
    if (chunkData.keyword.toLowerCase() === 'chara' || chunkData.keyword.toLowerCase() === 'ccv3') {
      chunks.splice(chunks.indexOf(tEXtChunk), 1);
    }
  }

  // Add new v2 chunk before the IEND chunk
  const base64EncodedData = Buffer.from(JSON.stringify(data), 'utf8').toString('base64');
  chunks.splice(-1, 0, PNGtext.encode('chara', base64EncodedData));

  // Try adding v3 chunk before the IEND chunk
  try {
    // change v2 format to v3
    const v3Data = { ...data };
    // @ts-ignore
    v3Data.spec = 'chara_card_v3';
    // @ts-ignore
    v3Data.spec_version = '3.0';

    const base64EncodedDataV3 = Buffer.from(JSON.stringify(v3Data), 'utf8').toString('base64');
    chunks.splice(-1, 0, PNGtext.encode('ccv3', base64EncodedDataV3));
  } catch (error) {
    // Ignore errors when adding v3 chunk
  }

  return Buffer.from(encode(chunks)).buffer;
}

/**
 * Reads Character metadata from a PNG image buffer.
 * Supports both V2 (chara) and V3 (ccv3). V3 (ccv3) takes precedence.
 * @param image PNG image buffer
 * @returns Character data
 * @throws Error if no PNG metadata or character data is found
 */
export function readScenarioFromPng(image: ArrayBuffer): FullExportData {
  const chunks = extract(new Uint8Array(image));
  const textChunks = chunks.filter((chunk) => chunk.name === 'tEXt').map((chunk) => PNGtext.decode(chunk.data));

  if (textChunks.length === 0) {
    console.error('PNG metadata does not contain any text chunks.');
    throw new Error('No PNG metadata.');
  }

  const ccv3Index = textChunks.findIndex((chunk) => chunk.keyword.toLowerCase() === 'ccv3');

  if (ccv3Index > -1) {
    const data = Buffer.from(textChunks[ccv3Index].text, 'base64').toString('utf8');
    return JSON.parse(data);
  }

  const charaIndex = textChunks.findIndex((chunk) => chunk.keyword.toLowerCase() === 'chara');

  if (charaIndex > -1) {
    const data = Buffer.from(textChunks[charaIndex].text, 'base64').toString('utf8');
    return JSON.parse(data);
  }

  console.error('PNG metadata does not contain any character data.');
  throw new Error('No PNG metadata.');
}
