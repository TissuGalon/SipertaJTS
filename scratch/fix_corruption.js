
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const projectRoot = 'e:/PROJECT/NEXTJS/SipertaJTS';

function fixXmlCorruption(fileName) {
    const filePath = path.join(projectRoot, 'surat', fileName);
    if (!fs.existsSync(filePath)) return;

    const zip = new PizZip(fs.readFileSync(filePath));
    let xmlContent = zip.file('word/document.xml').asText();

    // Fix <w:br/> inside <w:t>
    // This is the cause of "Not implemented" in mammoth
    while (xmlContent.includes('<w:t>') && xmlContent.includes('<w:br/>')) {
        const prevContent = xmlContent;
        xmlContent = xmlContent.replace(/<w:t>([^<]*?)<w:br\/>/g, '<w:t>$1</w:t><w:br/><w:t>');
        if (prevContent === xmlContent) break;
    }

    zip.file('word/document.xml', xmlContent);
    fs.writeFileSync(filePath, zip.generate({ type: 'nodebuffer' }));
    console.log(`Fixed XML corruption in ${fileName}`);
}

fixXmlCorruption('Surat Undangan Seminar.docx');
fixXmlCorruption('Surat Undangan Sidang.docx');
