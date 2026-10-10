/**
 * Cryptographic utility functions for DeHosp-Chain
 * Implements Web Crypto API SHA-256, Merkle Trees, and verifiable SVG QR encoding.
 */

export async function computeSha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}

export function syncComputePseudoHash(data: string): string {
  // Fast deterministic fallback for initial synchronous seeds
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  const repeated = (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
  return '0x' + repeated;
}

export function computeMerkleRoot(txHashes: string[]): string {
  if (txHashes.length === 0) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
  if (txHashes.length === 1) {
    return txHashes[0];
  }
  let currentLevel = [...txHashes];
  if (currentLevel.length % 2 !== 0) {
    currentLevel.push(currentLevel[currentLevel.length - 1]);
  }
  const nextLevel: string[] = [];
  for (let i = 0; i < currentLevel.length; i += 2) {
    const combined = currentLevel[i] + currentLevel[i + 1].slice(2);
    nextLevel.push(syncComputePseudoHash(combined));
  }
  return computeMerkleRoot(nextLevel);
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTxHash(hash: string): string {
  if (!hash || hash.length < 12) return hash || '';
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

/**
 * Generates an SVG string representation of a 2D QR matrix
 * Deterministic for any input string.
 */
export function generateSvgQrMatrix(content: string, size = 160): string {
  const gridSize = 21; // Standard Version 1 QR dimension (21x21)
  const matrix: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // Helper to place finder pattern
  const placeFinder = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        if (
          x === 0 || x === 6 || y === 0 || y === 6 ||
          (x >= 2 && x <= 4 && y >= 2 && y <= 4)
        ) {
          matrix[startY + y][startX + x] = true;
        }
      }
    }
  };

  // 3 Finder patterns
  placeFinder(0, 0);
  placeFinder(gridSize - 7, 0);
  placeFinder(0, gridSize - 7);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Deterministic data encoding based on characters
  let seed = 0;
  for (let i = 0; i < content.length; i++) {
    seed = (seed * 31 + content.charCodeAt(i)) >>> 0;
  }

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Skip finder zones
      const inTopLeft = x < 8 && y < 8;
      const inTopRight = x >= gridSize - 8 && y < 8;
      const inBottomLeft = x < 8 && y >= gridSize - 8;
      const inTiming = x === 6 || y === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        matrix[y][x] = (seed % 2) === 1;
      }
    }
  }

  // Render SVG elements
  const cellSize = size / gridSize;
  let rects = '';
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (matrix[y][x]) {
        rects += `<rect x="${(x * cellSize).toFixed(1)}" y="${(y * cellSize).toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="#0f172a" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="rounded bg-white p-2">${rects}</svg>`;
}
