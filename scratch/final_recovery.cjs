
const fs = require('fs');
const PizZip = require('pizzip');

function finalRecovery(xml) {
    // 1. Remove all w:t and /w:t tags
    let clean = xml.replace(/<\/?w:t[^>]*>/g, '');
    
    // 2. Remove all erroneous w:r tags if they are empty or just whitespace
    clean = clean.replace(/<w:r><\/w:r>/g, '');
    
    // 3. For every <w:r>, find the non-property content and wrap it in <w:t>
    // A run can have <w:rPr> (properties) and then other things (t, tab, br, drawing, etc.)
    // We want to find the text part and wrap it.
    
    clean = clean.replace(/<w:r([^>]*)>(.*?)<\/w:r>/gs, (match, attrs, content) => {
        let rPr = '';
        let other = content;
        
        // Extract properties
        let rPrMatch = content.match(/<w:rPr>.*?<\/w:rPr>/s);
        if (rPrMatch) {
            rPr = rPrMatch[0];
            other = content.replace(/<w:rPr>.*?<\/w:rPr>/s, '');
        }
        
        // Now 'other' contains things like 'Text', '<w:tab/>', '<w:br/>'
        // We need to wrap plain text in <w:t>
        // But we must NOT wrap other tags like <w:tab/> or <w:br/>
        
        // Simplified approach: split by tags
        let segments = other.split(/(<[^>]+>)/);
        let wrappedContent = segments.map(s => {
            if (!s) return '';
            if (s.startsWith('<')) return s;
            // It's text! Wrap it.
            return `<w:t xml:space="preserve">${s}</w:t>`;
        }).join('');
        
        return `<w:r${attrs}>${rPr}${wrappedContent}</w:r>`;
    });

    // 4. Final fix for Penguin3 sequence in Sidang
    if (clean.includes('{{Penguji2}}') && !clean.includes('{{Penguji3}}')) {
        clean = clean.replace('{{Penguji2}}', '{{Penguji2}}</w:t><w:br/><w:t>{{Penguji3}}');
    }

    return clean;
}

const files = [
    'e:/PROJECT/NEXTJS/SipertaJTS/surat/Surat Undangan Sidang.docx',
    'e:/PROJECT/NEXTJS/SipertaJTS/surat/Surat Undangan Seminar.docx'
];

files.forEach(file => {
    console.log(`Final recovery for ${file}...`);
    const zip = new PizZip(fs.readFileSync(file));
    let xml = zip.file('word/document.xml').asText();
    
    xml = finalRecovery(xml);
    
    zip.file('word/document.xml', xml);
    fs.writeFileSync(file, zip.generate({ type: 'nodebuffer' }));
});
