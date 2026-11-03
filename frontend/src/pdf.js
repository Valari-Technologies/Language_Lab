// A report as a PDF with tables, built in the browser from data already on screen.
// tables: [{ heading, head: [..], body: [[..]] }]. The PDF library is loaded only when someone downloads.
export const savePdf = async ({ file, title, subtitle, tables }) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(16);
  doc.text(title, 40, 50);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle, 40, 68);
  let y = 90;
  tables.forEach(({ heading, head, body }) => {
    if (heading) {
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(heading, 40, y);
      y += 8;
    }
    autoTable(doc, {
      startY: y,
      head: [head],
      body: body.map(row => row.map(v => String(v ?? '')).map(v => (v === '' ? '—' : v))),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 5 },
      margin: { left: 40, right: 40 },
    });
    y = doc.lastAutoTable.finalY + 24;
  });
  doc.save(file);
};
