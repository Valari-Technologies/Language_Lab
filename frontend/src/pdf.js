// A report as a PDF with tables, built in the browser from data already on screen.
// tables: [{ heading, head: [..], body: [[..]] }]. The PDF library is loaded only when someone downloads.
export const savePdf = async ({ file, title, subtitle, tables, landscape = false, schoolName, teacherName }) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = 38;
  if (schoolName && String(schoolName).trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(String(schoolName).trim(), pageWidth / 2, y, { align: 'center' });
    y += 28;
  } else {
    y = 48;
  }

  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 40, y);
    y += 18;
  }

  if (teacherName && String(teacherName).trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Teacher: ${String(teacherName).trim()}`, 40, y);
    y += 16;
  }

  if (subtitle && String(subtitle).trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(String(subtitle).trim(), 40, y);
    y += 18;
  }

  y += 4;

  tables.forEach(({ heading, head, body }) => {
    if (heading) {
      doc.setFont('helvetica', 'bold');
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
    y = doc.lastAutoTable.finalY + 22;
  });
  doc.save(file);
};
