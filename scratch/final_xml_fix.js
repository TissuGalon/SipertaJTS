
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const projectRoot = 'e:/PROJECT/NEXTJS/SipertaJTS';

function cleanAndSplit(xml) {
    let cleaned = xml;
    
    // 1. Fix double nested <w:t> tags: <w:t><w:t>...</w:t></w:t>
    cleaned = cleaned.replace(/<w:t>\s*<w:t>(.*?)<\/w:t>\s*<\/w:t>/g, '<w:t>$1</w:t>');
    
    // 2. Fix <w:br/> inside <w:t>: <w:t>A<w:br/>B</w:t> -> <w:t>A</w:t><w:br/><w:t>B</w:t>
    // We use a loop to handle multiple breaks in one tag
    let prev;
    do {
        prev = cleaned;
        cleaned = cleaned.replace(/<w:t>([^<]*?)<w:br\/>/g, '<w:t>$1</w:t><w:br/><w:t>');
    } while (cleaned !== prev);
    
    // 3. Remove empty <w:t></w:t> tags
    cleaned = cleaned.replace(/<w:t><\/w:t>/g, '');
    
    return cleaned;
}

function processTemplates() {
    const files = [
        'Surat Permohonan Magang.docx',
        'Surat Tugas Magang.docx',
        'Surat Undangan Seminar.docx',
        'Surat Undangan Sidang.docx'
    ];

    files.forEach(fileName => {
        const filePath = path.join(projectRoot, 'surat', fileName);
        if (!fs.existsSync(filePath)) return;

        const zip = new PizZip(fs.readFileSync(filePath));
        const xmlPath = 'word/document.xml';
        let xml = zip.file(xmlPath).asText();
        
        xml = cleanAndSplit(xml);
        
        // Final sanity check for Sidang Penguji names
        if (fileName === 'Surat Undangan Sidang.docx') {
           // Ensure we have {{Penguji1}}, {{Penguji2}}, {{Penguji3}} in sequence
           // We look for the part of the XML where these are likely to be
           // If they were bunched or messed up, we fix them.
           // Since we can't easily see the structure, we use a broad but safe fix
           xml = xml.replace(/{{Penguji1}}(?:<[^>]+>|\s)*{{Penguji1}}(?:<[^>]+>|\s)*{{Penguji2}}/, '{{Penguji1}}</w:t></w:r><w:r><w:t>{{Penguji2}}</w:t></w:r><w:r><w:t>{{Penguji3}}');
        }

        zip.file(xmlPath, xml);
        fs.writeFileSync(filePath, zip.generate({ type: 'nodebuffer' }));
        console.log(`Cleaned XML in ${fileName}`);
    });
}

processTemplates();
