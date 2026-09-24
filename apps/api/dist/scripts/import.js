"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const xlsx = __importStar(require("xlsx"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
// Helper untuk merapikan teks (mengubah "1. Teks  2. Teks" menjadi baris baru)
function formatText(text) {
    if (!text)
        return "";
    const str = String(text);
    // Mencari spasi yang diikuti dengan angka dan titik (misal " 1. ", "  2. ", "\n3. ")
    // dan menggantinya dengan newline \n secara konsisten
    return str.replace(/\s+(?=\d+\.\s)/g, '\n').trim();
}
async function main() {
    // Default to ./data/excel if no arg is provided
    const targetDir = process.argv[2] || "./data/excel";
    const absoluteDir = path.resolve(process.cwd(), targetDir);
    if (!fs.existsSync(absoluteDir)) {
        console.error(`Folder tidak ditemukan: ${absoluteDir}`);
        console.error(`Harap buat folder tersebut dan letakkan file excel di dalamnya.`);
        process.exit(1);
    }
    const files = fs.readdirSync(absoluteDir).filter(file => file.endsWith('.xlsx') && !file.startsWith('~'));
    if (files.length === 0) {
        console.warn(`Tidak ada file .xlsx yang ditemukan di dalam folder: ${absoluteDir}`);
        process.exit(0);
    }
    console.log(`Ditemukan ${files.length} file Excel di ${absoluteDir}.`);
    console.log("Membersihkan data Program Kerja lama agar tidak terjadi duplikasi...");
    await prisma.programKerja.deleteMany();
    console.log("Data lama berhasil dibersihkan! Memulai proses import...\n");
    for (const fileName of files) {
        const filePath = path.join(absoluteDir, fileName);
        console.log(`\n=================================================`);
        console.log(`Membaca file: ${fileName}`);
        console.log(`=================================================`);
        const workbook = xlsx.readFile(filePath);
        // Spesifik target sheet "ALL" sesuai instruksi user
        if (!workbook.Sheets["ALL"]) {
            console.warn(`[SKIP] Sheet "ALL" tidak ditemukan di dalam file ${fileName}. Melewati file ini.`);
            continue;
        }
        const worksheet = workbook.Sheets["ALL"];
        const data = xlsx.utils.sheet_to_json(worksheet);
        console.log(`Ditemukan ${data.length} baris data di sheet "ALL".`);
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const komisariatName = row["komisariat"];
            if (!komisariatName) {
                console.warn(`  [Baris ${i + 2}] Melewati data tanpa nama komisariat.`);
                continue;
            }
            // Cari Commissariat berdasarkan nama (menggunakan contains agar fleksibel)
            let commissariat = await prisma.commissariat.findFirst({
                where: {
                    name: {
                        contains: komisariatName,
                    },
                },
            });
            // Jika belum ada, auto-create profil komisariat tersebut
            if (!commissariat) {
                console.warn(`  [Baris ${i + 2}] Komisariat '${komisariatName}' tidak ditemukan di database. Membuat baru otomatis...`);
                commissariat = await prisma.commissariat.create({
                    data: {
                        // Misalnya "Komisariat UNAIR" menjadi "unair"
                        slug: komisariatName.toLowerCase().replace("komisariat ", "").replace(/\s+/g, '-'),
                        name: komisariatName,
                        university: komisariatName.replace("Komisariat ", ""),
                        description: `Profil resmi dari ${komisariatName}.`,
                        logo: "/assets/logos/genbi.svg",
                    }
                });
            }
            const { divisi, program_ke, nama_proker, tanggal_proker, format_pelaksanaan, status, link_proposal_pdf, deskripsi_proker, kpi_tuk_target, dampak, evaluasi, dokumentasi_drive, link_lpj_pdf, foto1, foto2, foto3, foto4, foto5, foto6 } = row;
            // Konversi format tanggal otomatis dari Excel Serial Number atau String biasa
            let parsedDate = new Date();
            if (tanggal_proker) {
                if (typeof tanggal_proker === "number") {
                    // Konversi dari base 1900 format Excel ke format JS Date
                    parsedDate = new Date(Math.round((tanggal_proker - 25569) * 86400 * 1000));
                }
                else {
                    parsedDate = new Date(tanggal_proker);
                }
            }
            if (isNaN(parsedDate.getTime())) {
                parsedDate = new Date(); // Fallback untuk tanggal teks seperti "Kondisional"
            }
            try {
                await prisma.programKerja.create({
                    data: {
                        commissariatId: commissariat.id,
                        divisi: divisi || "BPH",
                        programKe: program_ke ? parseInt(program_ke) : 1,
                        namaProker: nama_proker || "Tanpa Nama",
                        tanggalProker: parsedDate,
                        formatPelaksanaan: format_pelaksanaan || "Offline",
                        status: status || "Completed",
                        deskripsiProker: formatText(deskripsi_proker),
                        kpiTukTarget: formatText(kpi_tuk_target),
                        dampak: formatText(dampak),
                        evaluasi: formatText(evaluasi),
                        foto1: foto1 || null,
                        foto2: foto2 || null,
                        foto3: foto3 || null,
                        foto4: foto4 || null,
                        foto5: foto5 || null,
                        foto6: foto6 || null,
                    },
                });
                console.log(`  [Baris ${i + 2}] ✔️ Sukses import proker: ${nama_proker}`);
            }
            catch (err) {
                console.error(`  [Baris ${i + 2}] ❌ Gagal import proker: ${nama_proker}`, err);
            }
        }
    }
    console.log("\n✅ Semua file excel berhasil diproses dan dikirim ke database!");
}
main()
    .catch((e) => {
    console.error("Terjadi error fatal saat menjalankan import:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
