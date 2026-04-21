
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURATION
// ==========================================
const SUPABASE_URL = 'https://fiupxbzcutfnvvhbkwdy.supabase.co';
// PLEASE PASTE YOUR SERVICE ROLE KEY HERE
const SUPABASE_SERVICE_ROLE_KEY = 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE'; 

const BUCKET_NAME = 'letter_templates';
const SOURCE_DIR = './surat';

const FILES_TO_UPLOAD = [
    'Surat Permohonan Magang.docx',
    'Surat Tugas Magang.docx',
    'Surat Undangan Seminar.docx',
    'Surat Undangan Sidang.docx'
];
// ==========================================

async function uploadFiles() {
    if (SUPABASE_SERVICE_ROLE_KEY === 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE') {
        console.error('Error: Please paste your Supabase Service Role Key into the script.');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Starting upload to bucket: ${BUCKET_NAME}...`);

    for (const fileName of FILES_TO_UPLOAD) {
        const filePath = path.join(SOURCE_DIR, fileName);
        
        if (!fs.existsSync(filePath)) {
            console.warn(`[SKIP] File not found: ${filePath}`);
            continue;
        }

        const fileBuffer = fs.readFileSync(filePath);
        
        console.log(`Uploading ${fileName}...`);
        
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, fileBuffer, {
                contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                upsert: true
            });

        if (error) {
            console.error(`[FAIL] ${fileName}:`, error.message);
        } else {
            console.log(`[OK] ${fileName} uploaded successfully.`);
        }
    }

    console.log('\nAll done! You can now test the templates in the admin dashboard.');
}

uploadFiles();
