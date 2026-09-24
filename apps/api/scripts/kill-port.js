const { execSync } = require('child_process');

const PORT = 5000;

function getListeningPids() {
  try {
    const output = execSync('netstat -ano -p tcp', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const pids = new Set();

    for (const line of output.split(/\r?\n/)) {
      if (!line.includes(`:${PORT}`) || !line.toUpperCase().includes('LISTENING')) continue;

      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid)) {
        pids.add(Number(pid));
      }
    }

    return [...pids];
  } catch (error) {
    console.warn('Tidak bisa mengecek port via netstat:', error.message);
    return [];
  }
}

function killPid(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
    console.log(`Port ${PORT} dibebaskan dari PID ${pid}.`);
  } catch (error) {
    console.warn(`Gagal menutup PID ${pid}:`, error.message);
  }
}

const pids = getListeningPids();

if (pids.length === 0) {
  console.log(`Port ${PORT} belum dipakai. Melanjutkan start server...`);
  process.exit(0);
}

for (const pid of pids) {
  killPid(pid);
}

console.log(`Selesai membersihkan port ${PORT}.`);
process.exit(0);
