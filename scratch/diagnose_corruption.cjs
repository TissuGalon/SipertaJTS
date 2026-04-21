
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const files = [
    'e:/PROJECT/NEXTJS/SipertaJTS/surat/Surat Undangan Sidang.docx',
    'e:/PROJECT/NEXTJS/SipertaJTS/surat/Surat Undangan Seminar.docx'
];

files.forEach(file => {
    console.log(`Checking ${path.basename(file)}...`);
    try {
        const content = fs.readFileSync(file);
        const zip = new PizZip(content);
        const docXml = zip.file('word/document.xml');
        if (!docXml) {
            console.error(`  [ERROR] word/document.xml not found!`);
        } else {
            console.log(`  [OK] word/document.xml found. Length: ${docXml.asText().length}`);
            // Check for basic tag balance
            const text = docXml.asText();
            const openT = (text.match(/<w:t/g) || []).length;
            const closeT = (text.match(/<\/w:t>/g) || []).length;
            console.log(`  Tags: <w:t: ${openT}, </w:t>: ${closeT}`);
            if (openT !== closeT) {
                console.error(`  [ERROR] Mismatched <w:t> tags!`);
            }
        }
    } catch (e) {
        console.error(`  [CRITICAL] Failed to load ZIP: ${e.message}`);
    }
});
