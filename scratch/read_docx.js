
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

const fileName = process.argv[2] || '(Template) Surat Aktif Kuliah.docx';
const filePath = path.isAbsolute(fileName) ? fileName : path.join('e:/PROJECT/NEXTJS/SipertaJTS', fileName.startsWith('surat/') ? fileName : `surat/${fileName}`);

async function extractText() {
    try {
        const buffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer });
        console.log('--- RAW TEXT ---');
        console.log(result.value);
        
        // Also look for placeholders like {{...}}
        const placeholders = result.value.match(/{{[^}]+}}/g);
        console.log('\n--- PLACEHOLDERS FOUND ---');
        console.log(placeholders ? Array.from(new Set(placeholders)) : 'None found');
    } catch (error) {
        console.error('Error:', error);
    }
}

extractText();
