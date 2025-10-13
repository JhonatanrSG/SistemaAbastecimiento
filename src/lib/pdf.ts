import { PDFDocument, StandardFonts } from 'pdf-lib';

/* ===== RFQ PDF ===== */

export type RfqPdfHeader = {
  rfqId: string;
  supplier: string;
  email: string;
  requestId: string;
  branch: string;
  requester: string;
  dueDate: string; // YYYY-MM-DD
};

export type RfqPdfItem = {
  product: string;
  qty: number;
  uom: string;
  brand?: string;
};

export async function buildRfqPdf(
  header: RfqPdfHeader,
  items: RfqPdfItem[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  let page = doc.addPage();
  const marginX = 50;
  const lineH = 16;
  const titleSize = 18;
  const textSize = 12;

  const getHeight = () => page.getSize().height;
  let cursorY = getHeight() - marginX;

  const newPageIfNeeded = (lines = 1, size = textSize) => {
    const needed = lines * (size + 6);
    if (cursorY - needed < marginX) {
      page = doc.addPage();
      cursorY = getHeight() - marginX;
    }
  };

  const drawLine = (text: string, size = textSize) => {
    newPageIfNeeded(1, size);
    page.drawText(text, { x: marginX, y: cursorY, size, font });
    cursorY -= size + 6;
  };

  const drawKeyVal = (label: string, value: string) => drawLine(`${label}: ${value}`);

  drawLine('Solicitud de Cotización (RFQ)', titleSize);
  cursorY -= 4;

  drawKeyVal('RFQ', header.rfqId);
  drawKeyVal('Solicitud', header.requestId);
  drawKeyVal('Sucursal', header.branch);
  drawKeyVal('Solicitante', header.requester);
  drawKeyVal('Proveedor', `${header.supplier} <${header.email}>`);
  drawKeyVal('Fecha límite', header.dueDate);

  cursorY -= 4;
  drawLine('Ítems:', 14);

  items.forEach((it, i) => {
    const line = `${i + 1}. ${it.product} — ${it.qty} ${it.uom}${it.brand ? ` (${it.brand})` : ''}`;
    drawLine(line);
  });

  return doc.save();
}

/* ===== PO PDF ===== */

export type PoPdfHeader = {
  poId: string;
  supplier: string;
  email: string;
  requestId: string;
  branch: string;
  requester: string;
  date: string; // YYYY-MM-DD
};

export type PoPdfItem = {
  product: string;
  qty: number;
  uom: string;
  brand?: string;
  unitPriceCents: number;
};

export async function buildPoPdf(
  header: PoPdfHeader,
  items: PoPdfItem[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let page = pdfDoc.addPage();
  let y = page.getSize().height - 50;

  const draw = (text: string, size = 12) => {
    page.drawText(text, { x: 50, y, size, font: helvetica });
    y -= size + 6;
    if (y < 50) { page = pdfDoc.addPage(); y = page.getSize().height - 50; }
  };

  draw('Orden de Compra (PO)', 18);
  y -= 6;

  draw(`PO: ${header.poId}`);
  draw(`Solicitud: ${header.requestId}`);
  draw(`Sucursal: ${header.branch}`);
  draw(`Solicitante: ${header.requester}`);
  draw(`Proveedor: ${header.supplier} <${header.email}>`);
  draw(`Fecha OC: ${header.date}`);

  y -= 6;
  draw('Ítems:', 14);

  items.forEach((it, i) => {
    const unit = (it.unitPriceCents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
    const line = `${i + 1}. ${it.product} — ${it.qty} ${it.uom}${it.brand ? ` (${it.brand})` : ''} @ ${unit}`;
    draw(line);
  });

  return pdfDoc.save();
}
