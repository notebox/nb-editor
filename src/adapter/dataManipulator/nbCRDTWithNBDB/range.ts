import type {BlockID, NBRange, DBFieldID} from "@/domain"

export type NBCellRange = {
  templateBlockID: BlockID;
  recordBlockID: BlockID;
  fieldID: DBFieldID;
  offset?: {start: number; end: number; isCollapsed: boolean};
};

export const subCellRange = (range: NBRange): NBCellRange | null => {
  if (range.start.subPath?.type !== "db") return null
  if (!range.start.subPath?.fieldID) return null

  const startSubPath = range.start.subPath
  if (startSubPath.fieldID !== range.end.subPath?.fieldID)
    return null

  if (
    range.start.blockID !== range.end.blockID ||
    startSubPath.recordBlockID !== range.end.subPath?.recordBlockID
  )
    return null

  return {
    templateBlockID: range.start.blockID,
    recordBlockID: startSubPath.recordBlockID,
    fieldID: startSubPath.fieldID!,
    offset:
        range.start.offset != null && range.end.offset != null
          ? {
            start: range.start.offset,
            end: range.end.offset,
            isCollapsed: range.isCollapsed,
          }
          : undefined,
  }
}
