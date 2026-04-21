
const mammoth = require('mammoth');
const fs = require('fs');

async function test(file) {
    try {
        console.log(`Testing ${file}...`);
        const result = await mammoth.convertToHtml({ path: file });
        console.log(`  [OK] Length: ${result.value.length}`);
    } catch (e) {
        console.error(`  [FAIL] ${file}: ${e.message}`);
    }
}

async function run() {
    await test('surat/Surat Undangan Sidang.docx');
    await test('surat/Surat Undangan Seminar.docx');
    await test('surat/Surat Permohonan Magang.docx');
    await test('surat/Surat Tugas Magang.docx');
}

run();
