import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { SosAlert } from '../types';

const ESC: Record<string, string> = { perro: 'Perro', gato: 'Gato', otro: 'Animal' };
const TAM: Record<string, string> = { pequeño: 'Pequeño', mediano: 'Mediano', grande: 'Grande' };

async function imageToBase64(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, { mode: 'cors' });
    const blob = await r.blob();
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function generatePoster(alert: SosAlert, sosUrl: string): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; const H = 297;
  const headerColor = alert.tipo === 'lost' ? '#dc2626' : '#2563eb';
  const headerHex = alert.tipo === 'lost' ? [220, 38, 38] : [37, 99, 235];

  // Header
  pdf.setFillColor(headerHex[0], headerHex[1], headerHex[2]);
  pdf.rect(0, 0, W, 28, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const headerText = alert.tipo === 'lost' ? '🔴 SE BUSCA' : '🔵 SE HA ENCONTRADO';
  pdf.text(headerText, W / 2, 12, { align: 'center' });
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('ResQPet · SOS Pet', W / 2, 21, { align: 'center' });

  // Photo
  let photoY = 32;
  let photoH = 85;
  const foto = alert.fotos?.[0];
  if (foto) {
    const b64 = await imageToBase64(foto);
    if (b64) {
      pdf.addImage(b64, 'JPEG', 20, photoY, W - 40, photoH, undefined, 'FAST');
    } else {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, photoY, W - 40, photoH, 'F');
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(12);
      pdf.text('📷 Foto del animal', W / 2, photoY + photoH / 2, { align: 'center' });
    }
  } else {
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, photoY, W - 40, photoH, 'F');
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(14);
    pdf.text(alert.tipo === 'lost' ? '😟' : '🐾', W / 2, photoY + photoH / 2, { align: 'center' });
  }

  // Nombre
  let y = photoY + photoH + 10;
  if (alert.nombre_animal) {
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text(alert.nombre_animal.toUpperCase(), W / 2, y, { align: 'center' });
    y += 8;
  }

  // Details block
  pdf.setFillColor(248, 248, 248);
  pdf.rect(15, y, W - 30, 50, 'F');
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(50, 50, 50);

  const detalles = [
    alert.especie && `Especie: ${ESC[alert.especie] || alert.especie}`,
    alert.raza && `Raza: ${alert.raza}`,
    alert.color && `Color: ${alert.color}`,
    alert.tamaño && `Tamaño: ${TAM[alert.tamaño] || alert.tamaño}`,
    alert.señas_particulares && `Señas: ${alert.señas_particulares}`,
    alert.lleva_collar ? 'Lleva collar' : null,
  ].filter(Boolean) as string[];

  const col1 = detalles.slice(0, 3);
  const col2 = detalles.slice(3);
  col1.forEach((d, i) => { pdf.text(d, 20, y + 8 + i * 7); });
  col2.forEach((d, i) => { pdf.text(d, W / 2 + 5, y + 8 + i * 7); });
  y += 55;

  // Location & date
  pdf.setFillColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  if (alert.ubicacion_descripcion) { pdf.text(`📍 ${alert.ubicacion_descripcion}`, 20, y); y += 7; }
  if (alert.visto_en) {
    const d = new Date(alert.visto_en);
    pdf.text(`📅 ${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, 20, y); y += 7;
  }
  y += 5;

  // Contact
  pdf.setFillColor(headerHex[0], headerHex[1], headerHex[2]);
  pdf.rect(0, y, W, 28, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Si lo ves, llama:', W / 2, y + 9, { align: 'center' });
  pdf.setFontSize(16);
  pdf.text(`📞 ${alert.reportero_telefono || 'Ver aviso online'}`, W / 2, y + 19, { align: 'center' });
  y += 33;

  // QR Code
  try {
    const qrDataUrl = await QRCode.toDataURL(sosUrl, { width: 120, margin: 1 });
    const qrSize = 35;
    pdf.addImage(qrDataUrl, 'PNG', W / 2 - qrSize / 2, y, qrSize, qrSize);
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`resqpet.com/sos · ${alert.codigo_referencia}`, W / 2, y + qrSize + 5, { align: 'center' });
  } catch (e) { console.error('QR error', e); }

  // Watermark
  pdf.setTextColor(200, 200, 200);
  pdf.setFontSize(8);
  pdf.text('Generado por ResQPet · resqpet.com', W - 15, H - 5, { align: 'right' });

  pdf.save(`SOS-${alert.codigo_referencia || alert.id}.pdf`);
}
