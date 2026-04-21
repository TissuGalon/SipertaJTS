
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

const projectRoot = 'e:/PROJECT/NEXTJS/SipertaJTS';

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createFlexibleRegex(text) {
    return text.split('').map(c => {
        if (/\s/.test(c)) return '\\s*';
        return escapeRegExp(c);
    }).join('(?:<[^>]+>|\\s)*');
}

function modifyDocx(fileName, replacements) {
    const filePath = path.join(projectRoot, 'surat', fileName);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath);
    const zip = new PizZip(content);
    
    // List of XML files within the docx that might contain text
    const xmlFiles = [
        'word/document.xml',
        'word/header1.xml',
        'word/header2.xml',
        'word/header3.xml',
        'word/footer1.xml',
        'word/footer2.xml',
        'word/footer3.xml'
    ];

    // Sort replacements by length descending to prevent partial match issues (e.g. "Penguji II" vs "Penguji I")
    const sortedReplacements = Object.entries(replacements).sort((a, b) => b[0].length - a[0].length);

    xmlFiles.forEach(xmlPath => {
        const file = zip.file(xmlPath);
        if (file) {
            let xmlContent = file.asText();
            let modified = false;

            for (const [target, replacement] of sortedReplacements) {
                try {
                    const regex = new RegExp(createFlexibleRegex(target), 'g');
                    if (regex.test(xmlContent)) {
                        xmlContent = xmlContent.replace(regex, replacement);
                        modified = true;
                    }
                } catch (e) {
                    console.error(`Error creating regex for "${target}": ${e.message}`);
                }
            }

            if (modified) {
                zip.file(xmlPath, xmlContent);
            }
        }
    });

    const out = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE'
    });

    fs.writeFileSync(filePath, out);
    console.log(`Successfully updated ${fileName}`);
}

const tasks = [
    {
        file: 'Surat Permohonan Magang.docx',
        replacements: {
            'Imam Barazi Akbar Putra': '{{Nama}}',
            '2022223030022': '{{NIM}}',
            'PT. Bumi Karsa': '{{InstansiNama}}',
            'Reuleut, Kecamatan Muara Batu, Kabupaten Aceh Utara': '{{InstansiAlamat}}',
            'Pekerjaan Pembangunan Gedung RKU A dan Gedung RKU B': '{{PekerjaanNama}}',
            '6 (enam) bulan': '{{DurasiMagang}}',
            '22 Juli 2025': '{{Tanggal}}',
            '651/PL20.6.1/PK.01.06/2025': '{{NomorSurat}}',
            '0895-4282-04812': '{{NoHP}}'
        }
    },
    {
        file: 'Surat Tugas Magang.docx',
        replacements: {
            'Reza Rahmat Septiandi': '{{Nama}}',
            '2024/2025': '{{TahunAkademik}}',
            '22 Oktober 2025': '{{Tanggal}}',
            '910/PL20.6.1/PK.01.06/2025': '{{NomorSurat}}',
            'NIM : 0': 'NIM : {{NIM}}',
            'Nim : 0': 'Nim : {{NIM}}',
            'NIM : 0895-4282-04812': 'NIM : {{NIM}}', // Fix for weird previous state if needed
            '0895-4282-04812': '{{NoHP}}'
        }
    },
    {
        file: 'Surat Undangan Seminar.docx',
        replacements: {
            '25 Desember 2026': '{{Tanggal}}',
            '2025/2026': '{{TahunAkademik}}',
            'Nama \t\t: ': 'Nama : {{Nama}}',
            'NIM \t\t: ': 'NIM : {{NIM}}',
            'Hari/Tanggal \t: ': 'Hari/Tanggal : {{HariTanggal}}',
            'Waktu \t\t: ': 'Waktu : {{Waktu}}',
            'Ruang \t\t: ': 'Ruang : {{Ruang}}',
            'Judul \t\t: ': 'Judul : {{Judul}}',
            'Pembimbing Utama': '{{Pembimbing1}}',
            'Pembimbing Pendamping': '{{Pembimbing2}}',
            'Penguji I': '{{Penguji1}}',
            'Penguji II': '{{Penguji2}}'
        }
    },
    {
        file: 'Surat Undangan Sidang.docx',
        replacements: {
            '25 Desember 2026': '{{Tanggal}}',
            '2025/2026': '{{TahunAkademik}}',
            'Nama \t\t: ': 'Nama : {{Nama}}',
            'NIM \t\t: ': 'NIM : {{NIM}}',
            'Hari/Tanggal \t: ': 'Hari/Tanggal : {{HariTanggal}}',
            'Waktu \t\t: ': 'Waktu : {{Waktu}}',
            'Ruang \t\t: ': 'Ruang : {{Ruang}}',
            'Judul \t\t: ': 'Judul : {{Judul}}',
            'Pembimbing Utama': '{{Pembimbing1}}',
            'Pembimbing Pendamping': '{{Pembimbing2}}',
            '{{Penguji1}}III': '{{Penguji3}}',
            '{{Penguji1}}II': '{{Penguji2}}',
            '{{Penguji1}}I': '{{Penguji1}}',
            'Penguji III': '{{Penguji3}}',
            'Penguji II': '{{Penguji2}}',
            'Penguji I': '{{Penguji1}}'
        }
    }
];

tasks.forEach(task => {
    modifyDocx(task.file, task.replacements);
});
