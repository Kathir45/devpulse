const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const workbook = XLSX.readFile(path.join(__dirname, 'intern_assignment_support_pack_dev_only_v3.xlsx'));

console.log('=== SHEET NAMES ===');
console.log(workbook.SheetNames);

// Output each sheet as JSON
workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  
  console.log(`\n\n=== SHEET: ${sheetName} (${data.length} rows) ===`);
  
  if (data.length > 0) {
    console.log('COLUMNS:', Object.keys(data[0]));
    // Print all rows for data tables, first 5 for docs
    const isDataTable = !['Start_Here', 'Developer_Productivity_Brief', 'Assignment_Steps', 'AI_Guide', 'Data_Model_Overview', 'Metric_Examples'].includes(sheetName);
    const rowsToPrint = isDataTable ? data : data.slice(0, 10);
    rowsToPrint.forEach((row, i) => {
      console.log(`Row ${i}:`, JSON.stringify(row));
    });
    if (!isDataTable && data.length > 10) {
      console.log(`... (${data.length - 10} more rows)`);
    }
  }
  
  // Save data tables as JSON
  if (data.length > 0) {
    const safeName = sheetName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    fs.writeFileSync(
      path.join(__dirname, `extracted_${safeName}.json`),
      JSON.stringify(data, null, 2)
    );
  }
});
