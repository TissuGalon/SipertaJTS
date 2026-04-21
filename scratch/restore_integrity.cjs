
const fs = require('fs');
const PizZip = require('pizzip');

function fixXml(xml) {
    let result = '';
    let inT = false;
    let i = 0;
    while (i < xml.length) {
        if (xml.startsWith('<w:t', i)) {
            if (inT) {
                // We are already in a <w:t>, but found another one. Close the previous one.
                result += '</w:t>';
                inT = false;
            }
            // Find end of opening tag
            let endTag = xml.indexOf('>', i);
            result += xml.substring(i, endTag + 1);
            inT = true;
            i = endTag + 1;
        } else if (xml.startsWith('</w:t>', i)) {
            if (!inT) {
                // Found close but no open. Ignore or wrap? Let's ignore for now.
            } else {
                result += '</w:t>';
                inT = false;
            }
            i += 6;
        } else {
            result += xml[i];
            i++;
        }
    }
    if (inT) result += '</w:t>';
    return result;
}

const files = [
    'e:/PROJECT/NEXTJS/SipertaJTS/surat/Surat Undangan Sidang.docx',
    'e:/PROJECT/NEXTJS/SipertaJTS/surat/Surat Undangan Seminar.docx'
];

files.forEach(file => {
    console.log(`Fixing ${file}...`);
    const zip = new PizZip(fs.readFileSync(file));
    let xml = zip.file('word/document.xml').asText();
    
    // First, let's fix the specific Penguji3 issue if it's there
    // Re-instate {{Penguji3}} if it was intended
    if (file.includes('Sidang')) {
        // Ensure Penguji variables are correct
        // (This part is harder without knowing the state)
    }

    xml = fixXml(xml);
    
    zip.file('word/document.xml', xml);
    fs.writeFileSync(file, zip.generate({ type: 'nodebuffer' }));
});
