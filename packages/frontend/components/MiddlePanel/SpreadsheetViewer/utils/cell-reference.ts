/**
 * Cell Reference Utilities
 *
 * Convert spreadsheet coordinates to A1 notation for formula references
 */

/**
 * Convert column index to letter(s)
 * @param col - Zero-indexed column number (0 = A, 1 = B, 25 = Z, 26 = AA, etc.)
 * @returns Column letter(s) (A, B, ..., Z, AA, AB, ...)
 */
export function columnToLetter(col: number): string {
  let letter = ''
  let temp = col

  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter
    temp = Math.floor(temp / 26) - 1
    if (temp < 0) break
  }

  return letter
}

/**
 * Convert row and column indices to A1 notation
 * @param row - Zero-indexed row number
 * @param col - Zero-indexed column number
 * @returns Cell reference in A1 notation (e.g., "B5", "AA10")
 */
export function cellToA1(row: number, col: number): string {
  return `${columnToLetter(col)}${row + 1}`
}

/**
 * Convert range coordinates to A1 notation
 * @param r1 - Start row (zero-indexed)
 * @param c1 - Start column (zero-indexed)
 * @param r2 - End row (zero-indexed)
 * @param c2 - End column (zero-indexed)
 * @returns Range in A1 notation (e.g., "A1:B5" or just "A1" for single cell)
 */
export function rangeToA1(r1: number, c1: number, r2: number, c2: number): string {
  const start = cellToA1(r1, c1)
  const end = cellToA1(r2, c2)

  // If start and end are the same, just return single cell reference
  return (r1 === r2 && c1 === c2) ? start : `${start}:${end}`
}
