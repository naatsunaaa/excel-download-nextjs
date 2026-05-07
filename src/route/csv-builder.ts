import type { SheetData } from '../shared/types'

const BOM = '﻿'

export function buildCsv(sheetDataList: SheetData[]): Buffer {
  const lines: string[] = []

  for (let sheetIdx = 0; sheetIdx < sheetDataList.length; sheetIdx++) {
    const sheetData = sheetDataList[sheetIdx]

    if (sheetIdx > 0) {
      lines.push('')
    }

    for (let blockIdx = 0; blockIdx < sheetData.blocks.length; blockIdx++) {
      const block = sheetData.blocks[blockIdx]

      if (blockIdx > 0) {
        lines.push('')
      }

      lines.push(block.columns.map((col) => escapeCsvValue(col.label)).join(','))

      for (const row of block.rows) {
        const values = block.columns.map((col) => escapeCsvValue(String(row[col.key] ?? '')))
        lines.push(values.join(','))
      }
    }
  }

  return Buffer.from(BOM + lines.join('\r\n'), 'utf-8')
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
