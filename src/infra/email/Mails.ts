// src/infra/email/Mails.ts
import { writeFile } from 'fs/promises';
import path from 'path';

// LOG a consola + archivo plano en /public/mails (modo demo sin SMTP)
async function logMail(kind: 'RFQ' | 'PO', to: string, id: string, pdfPath: string) {
  const url = kind === 'RFQ'
    ? `http://localhost:3000/rfqs/${id}.pdf`
    : `http://localhost:3000/pos/${id}.pdf`;

  const lines = [
    '=== FAKE MAIL ==================================================',
    `To: ${to}`,
    `Subject: ${kind} ${id} - Konrad Gourmet`,
    'Body:',
    kind === 'RFQ'
      ? `Estimado proveedor,\nAdjuntamos la solicitud de cotización RFQ ${id}.\nRevise la fecha límite en el documento.\nDescarga del PDF: ${url}`
      : `Estimado proveedor,\nAdjuntamos la Orden de Compra PO ${id}.\nDescarga del PDF: ${url}`,
    `Adjunto (local): ${pdfPath}`,
    '===============================================================',
  ].join('\n');

  console.log(lines);

  const outDir = path.join(process.cwd(), 'public', 'mails');
  await writeFile(path.join(outDir, `${kind}-${id}.txt`), lines).catch(() => {});
}

export async function sendRfq(to: string, rfqId: string, pdfPath: string) {
  await logMail('RFQ', to, rfqId, pdfPath);
}

export async function sendPo(to: string, poId: string, pdfPath: string) {
  await logMail('PO', to, poId, pdfPath);
}
