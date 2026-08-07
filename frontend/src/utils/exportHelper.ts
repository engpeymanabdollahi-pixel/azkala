// ==================== Excel Export (با CDN) ====================

interface XLSXLibrary {
  utils: {
    json_to_sheet: (data: unknown[]) => unknown;
    book_new: () => unknown;
    book_append_sheet: (workbook: unknown, worksheet: unknown, sheetName: string) => void;
    writeFile: (workbook: unknown, filename: string) => void;
  };
}

declare const XLSX: XLSXLibrary | undefined;

interface ExcelRow {
  [key: string]: string | number | boolean | null | undefined;
}

export function exportToExcel(data: ExcelRow[], filename: string, sheetName: string = 'Sheet1') {
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
    const worksheetWithCols = worksheet as { '!cols'?: Array<{ wch: number }> };
    worksheetWithCols['!cols'] = columns.map(() => ({ wch: 20 }));

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Export to Excel error:', error);
    return false;
  }
}

// ==================== PDF Export (با CDN) ====================

interface JsPDF {
  new (options: { orientation: string; unit: string; format: string }): {
    setFontSize: (size: number) => void;
    text: (text: string, x: number, y: number) => void;
    autoTable: (options: {
      head: string[][];
      body: string[][];
      startY: number;
      styles: { fontSize: number; cellPadding: number };
      headStyles: { fillColor: number[]; textColor: number };
      alternateRowStyles: { fillColor: number[] };
    }) => void;
    save: (filename: string) => void;
  };
}

interface WindowWithJsPDF {
  jspdf: {
    jsPDF: JsPDF;
  };
}

declare const window: Window & typeof globalThis & WindowWithJsPDF;

interface PdfColumn {
  header: string;
  key: string;
}

interface PdfRow {
  [key: string]: string | number | boolean | null | undefined;
}

export function exportToPdf(
  data: PdfRow[],
  filename: string,
  title: string,
  columns: PdfColumn[]
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

interface CsvRow {
  [key: string]: string | number | boolean | null | undefined;
}

export function exportToCsv(data: CsvRow[], filename: string) {
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

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Export to CSV error:', error);
    return false;
  }
}
