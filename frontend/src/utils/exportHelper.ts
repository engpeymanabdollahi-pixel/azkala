// ==================== Excel Export (با CDN) ====================

declare const XLSX: any;

export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  try {
    if (typeof XLSX === 'undefined') {
      console.error('XLSX library not loaded');
      return false;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // تنظیم عرض ستون‌ها
    const columns = Object.keys(data[0] || {});
    worksheet['!cols'] = columns.map(() => ({ wch: 20 }));
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Export to Excel error:', error);
    return false;
  }
}

// ==================== PDF Export (با CDN) ====================

declare const window: any;

export function exportToPdf(
  data: any[],
  filename: string,
  title: string,
  columns: { header: string; key: string }[]
) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // عنوان
    doc.setFontSize(18);
    doc.text(title, 14, 15);

    // تاریخ
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString('fa-IR')}`, 14, 22);

    // جدول
    const headers = columns.map(col => col.header);
    const rows = data.map(item => 
      columns.map(col => String(item[col.key] ?? '-'))
    );

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [20, 184, 166],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [240, 253, 250],
      },
    });

    doc.save(`${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Export to PDF error:', error);
    return false;
  }
}

// ==================== CSV Export ====================

export function exportToCsv(data: any[], filename: string) {
  try {
    if (data.length === 0) return false;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return `"${String(value ?? '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Export to CSV error:', error);
    return false;
  }
}