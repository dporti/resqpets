import { jsPDF } from 'jspdf';

interface ReceiptData {
  receiptNumber: string;
  date: string;
  amount: number;
  donorName?: string;
  donorNif?: string;
  shelterName: string;
  shelterCif?: string;
  shelterAddress?: string;
  concept?: string;
  logoUrl?: string;
}

function amountToWords(n: number): string {
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
    'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (n === 0) return 'cero';
  if (n < 0) return 'menos ' + amountToWords(-n);

  const int = Math.floor(n);
  const dec = Math.round((n - int) * 100);

  let result = '';
  if (int >= 1000) {
    result += int >= 2000 ? amountToWords(Math.floor(int / 1000)) + ' mil ' : 'mil ';
  }
  const rem = int % 1000;
  if (rem >= 100) result += hundreds[Math.floor(rem / 100)] + ' ';
  const sub = rem % 100;
  if (sub < 20) result += units[sub];
  else result += tens[Math.floor(sub / 10)] + (sub % 10 ? ' y ' + units[sub % 10] : '');

  result = result.trim() + ' euros';
  if (dec > 0) result += ` con ${dec < 10 ? 'cero' + dec : amountToWords(dec).replace(' euros', '')} céntimos`;
  return result.trim();
}

export function generateReceipt(data: ReceiptData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // Header verde
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, W, 38, 'F');

  doc.setTextColor(255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('🐾 ' + data.shelterName, 14, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Recibo de Donación', 14, 25);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(data.receiptNumber, W - 14, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${new Date(data.date).toLocaleDateString('es-ES')}`, W - 14, 28, { align: 'right' });

  // Separator
  doc.setTextColor(0);
  let y = 52;

  // Donor info
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y - 6, W - 28, 28, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100);
  doc.text('DONANTE', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.setFontSize(13);
  doc.text(data.donorName || 'Donación Anónima', 20, y);
  y += 6;
  if (data.donorNif) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`NIF/DNI: ${data.donorNif}`, 20, y);
  }
  y += 18;

  // Amount
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.rect(14, y - 6, W - 28, 34, 'FD');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100);
  doc.text('IMPORTE DONADO', 20, y + 2);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(`${data.amount.toFixed(2)} €`, 20, y + 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80);
  const words = amountToWords(data.amount);
  doc.text(`(${words.charAt(0).toUpperCase() + words.slice(1)})`, 20, y + 24);
  y += 46;

  // Concept + Shelter
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.setFontSize(11);
  if (data.concept || true) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text('CONCEPTO', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text(data.concept || `Donación para ${data.shelterName}`, 14, y);
    y += 14;
  }

  // Shelter info
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y - 6, W - 28, 24, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100);
  doc.setFontSize(10);
  doc.text('ENTIDAD RECEPTORA', 20, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(data.shelterName, 20, y);
  y += 5;
  if (data.shelterCif || data.shelterAddress) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    const info = [data.shelterCif && `CIF: ${data.shelterCif}`, data.shelterAddress].filter(Boolean).join('  ·  ');
    doc.text(info, 20, y);
  }
  y += 18;

  // Legal text
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 224, 71);
  doc.rect(14, y - 4, W - 28, 20, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80);
  const legal = 'Esta donación puede ser deducible fiscalmente según la normativa vigente (Ley 49/2002 de régimen fiscal de las entidades sin fines lucrativos). Conserve este documento para su declaración de la renta.';
  const legalLines = doc.splitTextToSize(legal, W - 36);
  doc.text(legalLines, 20, y + 4);
  y += 26;

  // Footer
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('¡Gracias por tu generosidad! Tu apoyo hace posible nuestra misión. 🐾', W / 2, 280, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text(`${data.shelterName}  ·  ${data.receiptNumber}  ·  ${new Date(data.date).toLocaleDateString('es-ES')}`, W / 2, 286, { align: 'center' });

  const donorSlug = (data.donorName || 'Anonimo').replace(/\s+/g, '_');
  doc.save(`Recibo_${data.receiptNumber.replace(/-/g, '_')}_${donorSlug}.pdf`);
}
