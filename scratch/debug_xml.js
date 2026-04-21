
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const filePath = 'e:/PROJECT/NEXTJS/SipertaJTS/surat/Surat Undangan Seminar.docx';
const content = fs.readFileSync(filePath);
const zip = new PizZip(content);
const xml = zip.file('word/document.xml').asText();

fs.writeFileSync('scratch/document.xml', xml);
console.log('XML saved to scratch/document.xml');
