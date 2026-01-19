require("dotenv").config();
const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TOKEN_BOT;
const DB_FILE = process.env.DB_FILE || "./db.json";

if (!TOKEN) {
  console.error("ERROR: TOKEN_BOT belum diisi di .env");
  process.exit(1);
}

const bot = new Telegraf(TOKEN);

const dbPath = path.resolve(DB_FILE);

function ensureDbFile() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ users: {} }, null, 2), "utf8");
  }
}

function loadDb() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    const backup = dbPath + ".broken-" + Date.now();
    fs.copyFileSync(dbPath, backup);
    fs.writeFileSync(dbPath, JSON.stringify({ users: {} }, null, 2), "utf8");
    return { users: {} };
  }
}

function saveDb(db) {
  const tmp = dbPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, dbPath);
}

function getUser(db, userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      authorized: false,
      saldo: 0,
      tx: []
    };
  }
  return db.users[userId];
}

function formatRupiah(n) {
  const sign = n < 0 ? "-" : "";
  const val = Math.abs(n);
  return sign + "Rp" + val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseNominal(str) {
  if (!str) return null;
  const cleaned = str.replace(/[^\d]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

// ---------- Commands ----------
bot.start((ctx) => {
  ctx.reply(
    "<b>Fingo-Lite</b>\n\n" +
    "Fitur:\n" +
    "• /masuk {nominal} {keterangan}\n" +
    "• /keluar {nominal} {keterangan}\n" +
    "• /saldo\n" +
    "• /riwayat [jumlah]\n" +
    "• /rekap [bulan] (format: YYYY-MM)\n" +
    "• /hapus_terakhir\n" +
    "• /reset\n\n" +
    "Contoh:\n" +
    "/masuk 50000 gajian\n" +
    "/keluar 10000 ngopi", { parse_mode: "HTML" }
  );
});
bot.command("help", (ctx) => {
     ctx.reply(
    "<b>Fingo-Lite</b>\n\n" +
    "Fitur:\n" +
    "• /masuk {nominal} {keterangan}\n" +
    "• /keluar {nominal} {keterangan}\n" +
    "• /saldo\n" +
    "• /riwayat [jumlah]\n" +
    "• /rekap [bulan] (format: YYYY-MM)\n" +
    "• /hapus_terakhir\n" +
    "• /reset\n\n" +
    "Contoh:\n" +
    "/masuk 50000 gajian\n" +
    "/keluar 10000 ngopi", { parse_mode: "HTML" }
  );
});
bot.command("saldo", (ctx) => {
  

  const db = loadDb();
  const user = getUser(db, String(ctx.from.id));

  ctx.reply(
    "<b>FINGO-LITE</b>\n\n" + "Saldo kamu sekarang: " + formatRupiah(user.saldo), { parse_mode: "HTML" }
  );
});

bot.command("masuk", (ctx) => {
  

  const text = (ctx.message.text || "").trim();
  const parts = text.split(/\s+/);

  // /masuk nominal keterangan...
  const nominal = parseNominal(parts[1]);
  const ket = parts.slice(2).join(" ").trim();

  if (!nominal || !ket) {
    return ctx.reply(
      "Format: /masuk {nominal} {keterangan}\n" +
      "Contoh: /masuk 50000 gajian"
    );
  }

  const db = loadDb();
  const user = getUser(db, String(ctx.from.id));

  user.saldo += nominal;
  user.tx.push({
    type: "masuk",
    nominal,
    ket,
    ts: Date.now()
  });

  saveDb(db);

  ctx.reply(
    "<b>FINGO-LITE</b>\n" +
    "Dicatat (MASUK)\n" +
    "Nominal: " + formatRupiah(nominal) + "\n" +
    "Ket: " + ket + "\n" +
    "Saldo sekarang: " + formatRupiah(user.saldo)
  );
});

bot.command("keluar", (ctx) => {
  

  const text = (ctx.message.text || "").trim();
  const parts = text.split(/\s+/);

  // /keluar nominal keterangan...
  const nominal = parseNominal(parts[1]);
  const ket = parts.slice(2).join(" ").trim();

  if (!nominal || !ket) {
    return ctx.reply(
      "Format: /keluar {nominal} {keterangan}\n" +
      "Contoh: /keluar 10000 ngopi"
    );
  }

  const db = loadDb();
  const user = getUser(db, String(ctx.from.id));

  user.saldo -= nominal;
  user.tx.push({
    type: "keluar",
    nominal,
    ket,
    ts: Date.now()
  });

  saveDb(db);

  ctx.reply(
    "<b>FINGO-LITE</b>\n" +
    "Dicatat (KELUAR)\n" +
    "Nominal: " + formatRupiah(nominal) + "\n" +
    "Ket: " + ket + "\n" +
    "Saldo sekarang: " + formatRupiah(user.saldo), { parse_mode: "HTML" }
  );
});

bot.command("riwayat", (ctx) => {
  

  const text = (ctx.message.text || "").trim();
  const parts = text.split(/\s+/);
  const count = Math.min(Math.max(parseInt(parts[1] || "10", 10), 1), 50);

  const db = loadDb();
  const user = getUser(db, String(ctx.from.id));
  const tx = user.tx.slice(-count).reverse();

  if (tx.length === 0) return ctx.reply("📭 Belum ada transaksi.");

  const lines = tx.map((t, i) => {
    const d = new Date(t.ts);
    const tanggal = d.toLocaleString("id-ID");
    const sign = t.type === "masuk" ? "+" : "-";
    return (
      `${i + 1}. [${tanggal}] ${t.type.toUpperCase()} ${sign}${formatRupiah(t.nominal)}\n` +
      `   • ${t.ket}`
    );
  });

  ctx.reply("<b>FINGO-LITE</b>\n\nRiwayat terakhir:\n\n" + lines.join("\n"), { parse_mode: "HTML" });
});

bot.command("rekap", (ctx) => {
  

  const text = (ctx.message.text || "").trim();
  const parts = text.split(/\s+/);
  const monthStr = parts[1]; 

  const db = loadDb();
  const user = getUser(db, String(ctx.from.id));

  let y, m;
  const now = new Date();
  if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
    y = parseInt(monthStr.slice(0, 4), 10);
    m = parseInt(monthStr.slice(5, 7), 10) - 1;
  } else {
    y = now.getFullYear();
    m = now.getMonth();
  }

  const start = new Date(y, m, 1, 0, 0, 0, 0).getTime();
  const end = new Date(y, m + 1, 1, 0, 0, 0, 0).getTime();

  let totalMasuk = 0;
  let totalKeluar = 0;
  let countMasuk = 0;
  let countKeluar = 0;

  for (const t of user.tx) {
    if (t.ts >= start && t.ts < end) {
      if (t.type === "masuk") {
        totalMasuk += t.nominal; countMasuk++;
      } else {
        totalKeluar += t.nominal; countKeluar++;
      }
    }
  }

  const label = `${y}-${String(m + 1).padStart(2, "0")}`;

  ctx.reply(
    `Rekap bulan ${label}\n\n` +
    `• Masuk (${countMasuk}x): ${formatRupiah(totalMasuk)}\n` +
    `• Keluar (${countKeluar}x): ${formatRupiah(totalKeluar)}\n` +
    `• Net: ${formatRupiah(totalMasuk - totalKeluar)}\n\n` +
    `Saldo saat ini: ${formatRupiah(user.saldo)}\n\n` +
    `Tip: /rekap 2026-01`
  );
});

bot.command("hapus_terakhir", (ctx) => {
  

  const db = loadDb();
  const user = getUser(db, String(ctx.from.id));

  const last = user.tx.pop();
  if (!last) return ctx.reply("📭 Tidak ada transaksi untuk dihapus.");

  // revert saldo
  if (last.type === "masuk") user.saldo -= last.nominal;
  else user.saldo += last.nominal;

  saveDb(db);

  ctx.reply(
    "<b>FINGO-LITE</b>\n" +
    "Transaksi terakhir dihapus:\n" +
    `${last.type.toUpperCase()} ${formatRupiah(last.nominal)} - ${last.ket}\n` +
    `Saldo sekarang: ${formatRupiah(user.saldo)}`, { parse_mode: "HTML" }
  );
});

bot.command("reset", (ctx) => {
  

  const db = loadDb();
  const user = getUser(db, String(ctx.from.id));

  user.saldo = 0;
  user.tx = [];

  saveDb(db);

  ctx.reply("<b>FINGO-LITE</b>\n" +
    "Data kamu sudah di-reset. Saldo = Rp0, riwayat dikosongkan.", { parse_mode: "HTML" });
});

bot.on("text", (ctx) => {
  ctx.reply(
    "<b>FINGO-LITE</b>\n\n" +
    "Perintah yang tersedia:\n" +
    "/masuk {nominal} {keterangan}\n" +
    "/keluar {nominal} {keterangan}\n" +
    "/saldo\n" +
    "/riwayat [jumlah]\n" +
    "/rekap [YYYY-MM]\n" +
    "/hapus_terakhir\n" +
    "/reset", { parse_mode: "HTML" }
  );
});
bot.launch(console.log(`
========================================
Author       : RhysID
Name         : Fingo-Lite Bot
Project      : Catatan Keuangan Pribadi
Status       : ONLINE

Jangan lupa subscribe channel YouTube saya:
https://www.youtube.com/@RhysID
========================================
`));
// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
