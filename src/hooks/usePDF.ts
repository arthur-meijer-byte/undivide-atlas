import { jsPDF } from 'jspdf';
import type { City } from '../data/cities';
import { STATUS_LABEL } from '../data/cities';

export function exportCityPDF(city: City) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(232, 65, 24);
  doc.rect(0, 0, W, 80, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('UNDIVIDE', 32, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Territory Intelligence Report', 32, 62);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString(), W - 32, 42, { align: 'right' });

  // Title
  doc.setTextColor(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(city.name, 32, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`${city.country} · ${city.genre} · ${STATUS_LABEL[city.status]}`, 32, 138);
  doc.text(`Revenue potential: ${city.market.potentialRev}`, 32, 154);

  // Stat boxes
  const totalEvents = city.promoters.reduce((a, p) => a + p.events, 0);
  let totalSold = 0; let totalCap = 0;
  city.promoters.forEach((p) => p.events_list.forEach((e) => { totalSold += e.sold; totalCap += e.cap; }));
  const fillRate = totalCap ? Math.round((totalSold / totalCap) * 100) : 0;

  const stats = [
    { label: 'Total Events', value: String(totalEvents) },
    { label: 'Tickets Sold', value: totalSold.toLocaleString() },
    { label: 'Market Growth', value: city.market.growth },
  ];
  stats.forEach((s, i) => {
    const x = 32 + i * ((W - 64) / 3);
    const w = (W - 64) / 3 - 12;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, 180, w, 70, 6, 6, 'F');
    doc.setTextColor(232, 65, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(s.value, x + 14, 215);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(s.label, x + 14, 235);
  });

  doc.text(`Fill rate: ${fillRate}%`, 32, 275);

  // Promoters
  let y = 305;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text('Promoters & Lineups', 32, y); y += 18;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);

  city.promoters.forEach((p) => {
    if (y > H - 120) { doc.addPage(); y = 60; }
    doc.setFont('helvetica', 'bold');
    doc.text(`${p.name} (${p.type}) · ${p.events} events since ${p.since}`, 32, y); y += 14;
    doc.setFont('helvetica', 'normal');
    const lineup = `Lineup: ${p.lineup.join(', ')}`;
    const wrapped = doc.splitTextToSize(lineup, W - 64);
    doc.text(wrapped, 32, y); y += wrapped.length * 12 + 4;

    // Event table
    p.events_list.slice(0, 6).forEach((e) => {
      if (y > H - 80) { doc.addPage(); y = 60; }
      doc.setTextColor(100);
      doc.text(`${e.date} ${e.year}`, 40, y);
      doc.setTextColor(40);
      doc.text(e.name, 110, y);
      doc.text(`${e.sold}/${e.cap}`, W - 110, y);
      doc.text(`${Math.round((e.sold / e.cap) * 100)}%`, W - 50, y);
      y += 13;
    });
    y += 10;
  });

  // Footer
  doc.setFillColor(232, 65, 24);
  doc.rect(0, H - 30, W, 30, 'F');
  doc.setTextColor(255);
  doc.setFontSize(9);
  doc.text('undivideevents.com · Internal use only', W / 2, H - 11, { align: 'center' });

  doc.save(`Undivide_${city.name.replace(/\s+/g, '')}_Report.pdf`);
}
