interface CreateFormulaEngineParams {
  sheetName?: string
}

// Create a HyperFormula engine instance for Handsontable formulas plugin
export async function createFormulaEngine({ sheetName = 'Sheet1' }: CreateFormulaEngineParams): Promise<any | null> {
  try {
    const mod: any = await import('hyperformula')
    const HyperFormula = (mod as any).default || (mod as any).HyperFormula
    if (!HyperFormula) return null
    const engine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })
    try {
      // Ensure target sheet exists; ignore if already present
      if (engine && typeof engine.addSheet === 'function') engine.addSheet(sheetName)
    } catch {}
    return engine
  } catch {
    return null
  }
}

export type { CreateFormulaEngineParams }


