import ExcelJs from 'exceljs';
import { saveAs } from 'file-saver';


export const exportToExcel = async (data, fileName) => {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    const workbook = new ExcelJs.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    const response = await fetch('/logo_kantor.png');
    const logoBuffer = await response.arrayBuffer();
    const logoImageId = workbook.addImage({
        buffer: logoBuffer,
        extension: 'png',
    });

    worksheet.addImage(logoImageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 150, height: 50 },
    });

    worksheet.addRow([]);
    worksheet.addRow([]);
    worksheet.addRow([]);

    const headers = Object.keys(data[0]);
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F75B6' } };
    });

    data.forEach((item) => {
        const rowValues = headers.map((header) => item[header]);
        worksheet.addRow(rowValues);
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${fileName}.xlsx`);
    }); 


}
