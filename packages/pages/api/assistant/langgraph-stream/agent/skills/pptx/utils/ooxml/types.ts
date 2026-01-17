/**
 * Type definitions for OOXML utilities
 */

export interface UnpackOptions {
  /** Whether to pretty-print XML files (default: true) */
  prettyPrint?: boolean
}

export interface PackOptions {
  /** Whether to validate the output file (default: false) */
  validate?: boolean
  /** Whether to force packing even if validation fails (default: false) */
  force?: boolean
}
