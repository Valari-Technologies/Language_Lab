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

// Multi-student Class Report PDF: full student dossier with roll-number order, school header, class & teacher info,
// and all 4 tables (Student details, Performance, Lessons, Assessments) per student.
export const saveClassReportPdf = async ({
  file,
  schoolName,
  title = 'Class Report',
  teacherName,
  className,
  totalStudents,
  students = [],
}) => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const parseRoll = (r) => {
    const s = String(r ?? '').trim();
    const match = s.match(/^(\d+)/);
    if (match) return [parseInt(match[1], 10), s];
    return [Number.MAX_SAFE_INTEGER, s];
  };

  const sortedStudents = [...students].sort((a, b) => {
    const [numA, strA] = parseRoll(a.rollNo);
    const [numB, strB] = parseRoll(b.rollNo);
    if (numA !== numB) return numA - numB;
    if (strA !== strB) return strA.localeCompare(strB);
    return (a.name || '').localeCompare(b.name || '');
  });

  const statusText = (a) => String(a.status || '').replace(/_/g, ' ');
  const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
  const percent = (v) => (v === null || v === undefined ? '—' : `${v}%`);

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

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 40, y);
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  if (teacherName && String(teacherName).trim()) {
    doc.text(`Teacher: ${String(teacherName).trim()}`, 40, y);
    y += 15;
  }
  if (className && String(className).trim()) {
    doc.text(`Class: ${String(className).trim()}`, 40, y);
    y += 15;
  }
  const count = totalStudents ?? sortedStudents.length;
  doc.text(`Total Students: ${count}`, 40, y);
  y += 22;

  sortedStudents.forEach((s, idx) => {
    if (idx > 0) {
      doc.addPage();
      y = 38;
      if (schoolName && String(schoolName).trim()) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text(String(schoolName).trim(), pageWidth / 2, y, { align: 'center' });
        y += 22;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(100, 116, 139);
      const sub = ['Class Report', className ? `Class: ${className}` : '', teacherName ? `Teacher: ${teacherName}` : ''].filter(Boolean).join(' · ');
      doc.text(sub, 40, y);
      y += 20;
    }

    // Student Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text(`Student: ${s.name}`, 40, y);
    y += 10;

    // 1. Details Table
    const resolvedClass = s.classLabel || s.class_name || [s.grade, s.section ? (/^section\b/i.test(s.section) ? s.section : `Section ${s.section}`) : ''].filter(Boolean).join(' · ') || '—';
    autoTable(doc, {
      startY: y,
      head: [['Student', 'Login code', 'Roll No', 'Class']],
      body: [[s.name, s.loginCode || '—', s.rollNo || '—', resolvedClass]],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 4.5, textColor: [15, 23, 42] },
      margin: { left: 40, right: 40 },
    });
    y = doc.lastAutoTable.finalY + 14;

    // 2. Performance Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Performance', 40, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [['Overall progress', 'Zones completed', 'Levels completed', 'Avg assessment score', 'Attempts', 'Last active']],
      body: [[
        s.progress === null ? 'No levels published' : `${s.progress}%`,
        `${s.zonesCompleted ?? 0}/${s.zonesTotal ?? 6}`,
        `${s.levelsCompleted ?? 0}/${s.levelsTotal ?? 30}`,
        s.avgAssessment === null ? 'Not assessed' : percent(s.avgAssessment),
        s.attempts ?? 0,
        fmt(s.lastActive),
      ]],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4.5, textColor: [15, 23, 42] },
      margin: { left: 40, right: 40 },
    });
    y = doc.lastAutoTable.finalY + 14;

    // 3. Lessons Table
    const lessons = (s.attemptsList || []).filter(a => a.kind === 'lesson');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Lessons', 40, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [['Lesson', 'Status', 'Started At', 'Ended At']],
      body: lessons.length
        ? lessons.map(a => [a.title, statusText(a), fmt(a.startedAt), fmt(a.completedAt)])
        : [['No lessons played yet', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4.5, textColor: [15, 23, 42] },
      margin: { left: 40, right: 40 },
    });
    y = doc.lastAutoTable.finalY + 14;

    // 4. Assessments Table
    const assessments = (s.attemptsList || []).filter(a => a.kind === 'assessment');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Assessments', 40, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [['Assessment', 'Marks', 'Score', 'Status', 'Started At', 'Ended At']],
      body: assessments.length
        ? assessments.map(a => [
            a.title,
            a.score !== null && a.maxScore !== null ? `${a.score} / ${a.maxScore}` : 'N/A',
            a.percentage !== null ? `${a.percentage}%` : 'N/A',
            statusText(a),
            fmt(a.startedAt),
            fmt(a.completedAt),
          ])
        : [['No assessments taken yet', '', '', '', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4.5, textColor: [15, 23, 42] },
      margin: { left: 40, right: 40 },
    });
    y = doc.lastAutoTable.finalY + 20;
  });

  doc.save(file);
};
