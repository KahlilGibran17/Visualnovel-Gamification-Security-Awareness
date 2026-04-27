import jsPdf from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPdf = async (data, fileName) => {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }
    const doc = new jsPdf();

    const response = await fetch('/logo_kantor.png');
    const blob = await response.blob();
    const reader = new FileReader();

    reader.onload = function () {
      const logoBase64 = reader.result;

      // Logo di kiri (x, y, width, height)
        doc.addImage(logoBase64, 'PNG', 10, 8, 35, 18);

        // Nama perusahaan (tengah, bold)
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('PT AKEBONO BRAKE ASTRA INDONESIA', 105, 12, { align: 'center' });

        // Department (tengah, italic)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(80, 80, 80);
        doc.text('Information Technology Department', 105, 18, { align: 'center' });

        // Judul dokumen (tengah, bold)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Compliance Report', 105, 24, { align: 'center' });

        // Garis biru bawah kop
        doc.setDrawColor(0, 70, 127);   // warna biru tua
        doc.setLineWidth(0.8);
        doc.line(10, 30, 200, 30);      // garis pertama

        doc.setDrawColor(100, 160, 220); // warna biru muda
        doc.setLineWidth(0.3);
        doc.line(10, 31.5, 200, 31.5);  // garis kedua (tipis)

        // =====================
        // TABEL DATA
        // =====================
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(key => item[key]));


        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 38,
            styles: { fontSize: 10 },
            headStyles: {
                fillColor: [47, 117, 182],
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [240, 240, 240], // warna selang-seling baris
            },
        });

        doc.save(`${fileName}.pdf`);
    };

    reader.readAsDataURL(blob);
};