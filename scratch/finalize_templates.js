
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const projectRoot = 'e:/PROJECT/NEXTJS/SipertaJTS';

function fixBunchedText(fileName) {
    const filePath = path.join(projectRoot, 'surat', fileName);
    if (!fs.existsSync(filePath)) return;

    const zip = new PizZip(fs.readFileSync(filePath));
    let xmlContent = zip.file('word/document.xml').asText();

    // Fix the bunched up variables by adding line breaks
    // Correct XML for line break: </w:t><w:br/><w:t>
    const pattern = /{{Nama}}NIM : {{NIM}}Hari\/Tanggal : {{HariTanggal}}Waktu : {{Waktu}}Ruang : {{Ruang}}Judul : {{Judul}}/;
    const replacement = '{{Nama}}</w:t><w:br/><w:t>NIM : {{NIM}}</w:t><w:br/><w:t>Hari/Tanggal : {{HariTanggal}}</w:t><w:br/><w:t>Waktu : {{Waktu}}</w:t><w:br/><w:t>Ruang : {{Ruang}}</w:t><w:br/><w:t>Judul : {{Judul}}';
    
    if (xmlContent.includes('{{Nama}}NIM : {{NIM}}')) {
        xmlContent = xmlContent.replace(pattern, replacement);
        console.log(`Fixed bunched text in ${fileName}`);
    }

    // Also fix the double Penguji1 in Sidang
    if (fileName === 'Surat Undangan Sidang.docx') {
        // Find the sequence of three Penguji cells and fix them
        // We match them even if they are in different tags
        xmlContent = xmlContent.replace(/{{Penguji1}}(?:<[^>]+>|\s)*{{Penguji1}}(?:<[^>]+>|\s)*{{Penguji2}}/, '{{Penguji1}}</w:t><w:br/><w:t>{{Penguji2}}</w:t><w:br/><w:t>{{Penguji3}}');
    }

    zip.file('word/document.xml', xmlContent);
    fs.writeFileSync(filePath, zip.generate({ type: 'nodebuffer' }));
}

function fixTugasMagang() {
    const filePath = path.join(projectRoot, 'surat', 'Surat Tugas Magang.docx');
    if (!fs.existsSync(filePath)) return;
    const zip = new PizZip(fs.readFileSync(filePath));
    let xmlContent = zip.file('word/document.xml').asText();

    // Find "NIM" then literal text then "0"
    // Use regex that avoids crossing tags too much but handles the common cases
    xmlContent = xmlContent.replace(/NIM(?:<[^>]+>|\s)*:(?:<[^>]+>|\s)*0/g, 'NIM : {{NIM}}');
    xmlContent = xmlContent.replace(/Nim(?:<[^>]+>|\s)*:(?:<[^>]+>|\s)*0/g, 'NIM : {{NIM}}');

    zip.file('word/document.xml', xmlContent);
    fs.writeFileSync(filePath, zip.generate({ type: 'nodebuffer' }));
    console.log('Fixed NIM in Surat Tugas Magang.docx');
}

fixBunchedText('Surat Undangan Seminar.docx');
fixBunchedText('Surat Undangan Sidang.docx');
fixTugasMagang();
