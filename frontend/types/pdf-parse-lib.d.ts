declare module "pdf-parse/lib/pdf-parse.js" {
  export type PdfParseResult = {
    text?: string
    numpages?: number
    numrender?: number
    info?: Record<string, unknown>
    metadata?: unknown
    version?: string
  }

  export default function pdfParse(dataBuffer: Buffer | Uint8Array | ArrayBuffer): Promise<PdfParseResult>
}
