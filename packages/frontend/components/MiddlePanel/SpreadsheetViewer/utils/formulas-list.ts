export interface FormulaSpec {
  name: string
  description: string
}

export const FORMULA_SPECS: FormulaSpec[] = [
  { name: 'SUM', description: 'Sum of a series of numbers' },
  { name: 'AVERAGE', description: 'Average (arithmetic mean) of numbers' },
  { name: 'COUNT', description: 'Count of numbers' },
  { name: 'COUNTA', description: 'Count of non-empty cells' },
  { name: 'MIN', description: 'Minimum value' },
  { name: 'MAX', description: 'Maximum value' },
  { name: 'IF', description: 'Conditionally return a value' },
  { name: 'AND', description: 'Logical AND' },
  { name: 'OR', description: 'Logical OR' },
  { name: 'NOT', description: 'Logical NOT' },
  { name: 'VLOOKUP', description: 'Vertical lookup' },
  { name: 'HLOOKUP', description: 'Horizontal lookup' },
  { name: 'INDEX', description: 'Get value at row/column in a range' },
  { name: 'MATCH', description: 'Position of a value within a range' },
  { name: 'ROUND', description: 'Round a number to a specified number of digits' },
  { name: 'ROUNDUP', description: 'Round a number up' },
  { name: 'ROUNDDOWN', description: 'Round a number down' },
  { name: 'CONCAT', description: 'Concatenate strings' },
  { name: 'TEXT', description: 'Format a number as text' },
  { name: 'DATE', description: 'Create a date from components' },
  { name: 'TODAY', description: 'Current date' },
  { name: 'NOW', description: 'Current date and time' },
  { name: 'LEN', description: 'Length of a string' },
  { name: 'TRIM', description: 'Trim leading and trailing spaces' },
  { name: 'LEFT', description: 'Left substring' },
  { name: 'RIGHT', description: 'Right substring' },
  { name: 'MID', description: 'Substring from the middle' },
  { name: 'UPPER', description: 'Convert to uppercase' },
  { name: 'LOWER', description: 'Convert to lowercase' },
  { name: 'ABS', description: 'Absolute value' },
  { name: 'SIN', description: 'Sine of an angle (radians)' },
  { name: 'COS', description: 'Cosine of an angle (radians)' },
  { name: 'TAN', description: 'Tangent of an angle (radians)' }
]


