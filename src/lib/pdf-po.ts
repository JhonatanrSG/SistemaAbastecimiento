import { PDFDocument, StandardFonts } from 'pdf-lib';

export type PoHeader = {
  poId: string;
  rfqId: string;
  supplier: string;
  email: string;
  createdAt: string; // YYYY-MM-DD
};

export type PoItemLine = {
  product: string;
  qty: number;
  uom: string;
  unitPriceCents: number;
};

export async function buildPoPdf(header: PoHeader, items: PoItemLine[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage();
  let y = page.getSize().height - 50;

  const draw = (text: string, size = 12) => {
    page.drawText(text, { x: 50, y, size, font }); y -= size + 6;
    if (y < 50) { page = pdf.addPage(); y = page.getSize().height - 50; }
  };

  draw('Orden de Compra (OC)', 18);
  y -= 6;
  draw(`OC: ${header.poId}`);
  draw(`RFQ: ${header.rfqId}`);
  draw(`Proveedor: ${header.supplier} <${header.email}>`);
  draw(`Fecha: ${header.createdAt}`);
  y -= 6; draw('Ítems:', 14);

  let total = 0;
  items.forEach((it, i) => {
    const lineTotal = it.qty * it.unitPriceCents;
    total += lineTotal;
    draw(`${i + 1}. ${it.product} — ${it.qty} ${it.uom} x $${(it.unitPriceCents/100).toFixed(2)} = $${(lineTotal/100).toFixed(2)}`);
  });

  y -= 6;
  draw(`Total: $${(total/100).toFixed(2)}`, 14);

  return pdf.save();
}
