import ExcelJS from 'exceljs'
import type { DefaultStyles, SheetData, SourceColumn } from '../shared/types'

export async function buildExcelWorkbook(
  sheetDataList: SheetData[],
  defaultStyles?: DefaultStyles
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()

  for (const sheetData of sheetDataList) {
    const worksheet = workbook.addWorksheet(sheetData.name)
    let currentRow = 1

    for (let blockIdx = 0; blockIdx < sheetData.blocks.length; blockIdx++) {
      const block = sheetData.blocks[blockIdx]

      if (blockIdx > 0) {
        currentRow++
      }

      worksheet.getRow(currentRow).values = block.columns.map((col) => col.label)
      applyHeaderStyles(worksheet, currentRow, block.columns, defaultStyles)
      currentRow++

      for (const row of block.rows) {
        const rowValues = block.columns.map((col) => row[col.key] ?? '')
        worksheet.getRow(currentRow).values = rowValues
        currentRow++
      }

      applyColumnWidths(worksheet, block.columns, defaultStyles)
      applyColumnStyles(worksheet, block.columns, sheetData.blocks[0] === block ? 1 : currentRow - block.rows.length)
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

function applyHeaderStyles(
  worksheet: ExcelJS.Worksheet,
  rowNumber: number,
  columns: SourceColumn[],
  defaultStyles?: DefaultStyles
): void {
  const headerRow = worksheet.getRow(rowNumber)

  for (let i = 0; i < columns.length; i++) {
    const cell = headerRow.getCell(i + 1)

    if (defaultStyles?.headerFont) {
      cell.font = {
        bold: defaultStyles.headerFont.bold,
        color: defaultStyles.headerFont.color,
        size: defaultStyles.headerFont.size,
      }
    } else {
      cell.font = { bold: true }
    }

    if (defaultStyles?.headerFill) {
      cell.fill = {
        type: defaultStyles.headerFill.type,
        pattern: defaultStyles.headerFill.pattern,
        fgColor: defaultStyles.headerFill.fgColor,
      }
    }
  }
}

function applyColumnWidths(
  worksheet: ExcelJS.Worksheet,
  columns: SourceColumn[],
  defaultStyles?: DefaultStyles
): void {
  for (let i = 0; i < columns.length; i++) {
    const col = worksheet.getColumn(i + 1)
    const style = columns[i].style
    col.width = style?.width ?? defaultStyles?.defaultWidth ?? 20
  }
}

function applyColumnStyles(
  worksheet: ExcelJS.Worksheet,
  columns: SourceColumn[],
  dataStartRow: number
): void {
  for (let i = 0; i < columns.length; i++) {
    const style = columns[i].style
    if (!style) continue

    const col = worksheet.getColumn(i + 1)

    if (style.numFmt) {
      col.numFmt = style.numFmt
    }
    if (style.alignment) {
      col.alignment = style.alignment
    }
    if (style.font) {
      for (let r = dataStartRow; r <= worksheet.rowCount; r++) {
        const cell = worksheet.getRow(r).getCell(i + 1)
        cell.font = { ...cell.font, ...style.font }
      }
    }
    if (style.fill) {
      for (let r = dataStartRow; r <= worksheet.rowCount; r++) {
        const cell = worksheet.getRow(r).getCell(i + 1)
        cell.fill = style.fill
      }
    }
  }
}
