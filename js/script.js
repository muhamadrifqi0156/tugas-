const $ = (selector) => document.querySelector(selector);
const page = document.body.dataset.page;
const user = JSON.parse(sessionStorage.getItem("user") || "null");

function el(tag, text, parent) {
  const node = document.createElement(tag);
  node.textContent = text ?? "";
  if (parent) parent.appendChild(node);
  return node;
}

function isValidEmail(value) {
  const posisiAt = value.indexOf("@");          
  const posisiTitik = value.lastIndexOf(".");  

  if (value.includes(" ")) return false;
  if (posisiAt < 1 || posisiAt !== value.lastIndexOf("@")) return false;
  if (posisiTitik < posisiAt + 2) return false;
  if (posisiTitik === value.length - 1) return false;

  return true;
}

function showError(selector, message) {
  $(selector).textContent = message;
  return false;
}

if (page !== "login" && !user) {
  location.href = "index.html";
}

document.addEventListener("click", (e) => {
  const target = e.target;

  if (target.dataset.open) $(target.dataset.open).classList.add("show");
  if (target.dataset.close) $(target.dataset.close).classList.remove("show");

  // Klik area gelap di luar kartu = tutup modal
  if (target.classList.contains("modal")) target.classList.remove("show");
});

/* NAVBAR (dibuat sekali, dipakai semua halaman dalam)*/
function renderNavbar() {
  const menu = [
    ["dashboard.html", "Dashboard"],
    ["stok.html", "Informasi Bahan Ajar"],
    ["tracking.html", "Tracking Pengiriman"],
  ];

  const links = menu
    .map(([href, label]) => {
      const active = href.startsWith(page) ? "on" : "";
      return `<a href="${href}" class="${active}">${label}</a>`;
    })
    .join("");

  $("#nav").innerHTML = `
    <span class="brand">SITTA UT</span>
    ${links}
    <div class="dd">
      <span tabindex="0">Laporan ▾</span>
      <div>
        <a href="dashboard.html#monitoring">Monitoring Progress DO Bahan Ajar</a>
        <a href="dashboard.html#rekap">Rekap Bahan Ajar</a>
      </div>
    </div>
    <a href="dashboard.html#histori">Histori Transaksi Bahan Ajar</a>
    <a href="#" class="out" id="logout">Keluar</a>
  `;

  $("#logout").addEventListener("click", (e) => {
    e.preventDefault();
    sessionStorage.clear();
    location.href = "index.html";
  });
}

if ($("#nav")) renderNavbar();

/*HALAMAN LOGIN*/
function initLogin() {
  // --- Form login ---
  $("#formLogin").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#email").value.trim();
    const password = $("#password").value;

    if (!email || !password) {
      return showError("#errLogin", "Email dan password wajib diisi.");
    }

    const found = dataPengguna.find(
      (u) => u.email === email && u.password === password
    );

    if (!found) {
      alert("Email/password yang anda masukkan salah");
      return;
    }

    sessionStorage.setItem("user", JSON.stringify(found));
    location.href = "dashboard.html";
  });

  //Modal lupa password
  $("#formLupa").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#lupaEmail").value.trim();

    if (!isValidEmail(email)) {
      return showError("#errLupa", "Format email tidak valid.");
    }
    if (!dataPengguna.some((u) => u.email === email)) {
      return showError("#errLupa", "Email tidak terdaftar.");
    }

    alert("Link reset password telah dikirim ke " + email);
    $("#mLupa").classList.remove("show");
  });

  // Modal daftar akun
  $("#formDaftar").addEventListener("submit", (e) => {
    e.preventDefault();
    const nama = $("#dNama").value.trim();
    const email = $("#dEmail").value.trim();
    const password = $("#dPass").value;

    if (!nama || !email || !password) {
      return showError("#errDaftar", "Semua kolom wajib diisi.");
    }
    if (!isValidEmail(email)) {
      return showError("#errDaftar", "Format email tidak valid.");
    }
    if (password.length < 6) {
      return showError("#errDaftar", "Password minimal 6 karakter.");
    }
    if (dataPengguna.some((u) => u.email === email)) {
      return showError("#errDaftar", "Email sudah terdaftar.");
    }

    dataPengguna.push({
      id: dataPengguna.length + 1,
      nama,
      email,
      password,
      role: "UPBJJ-UT",
      lokasi: "-",
    });

    alert("Pendaftaran berhasil. Silakan login.");
    $("#errDaftar").textContent = "";
    e.target.reset();
    $("#mDaftar").classList.remove("show");
  });
}

/* PROGRESS PENGIRIMAN (dipakai dashboard & tracking)*/
function hitungProgress(data) {
  const terakhir = data.perjalanan[data.perjalanan.length - 1].keterangan;

  if (terakhir.startsWith("Selesai")) return 100;
  return data.status === "Dalam Perjalanan" ? 70 : 40;
}

/* HALAMAN DASHBOARD*/
function getGreeting() {
  const jam = new Date().getHours();

  if (jam < 11) return "pagi";
  if (jam < 15) return "siang";
  if (jam < 18) return "sore";
  return "malam";
}

// Membuat judul + tabel kosong, mengembalikan <tbody> untuk diisi
function buatTabel(parent, judul, kolom) {
  el("h3", judul, parent);
  const tabel = el("table", "", parent);
  const barisHead = el("tr", "", el("thead", "", tabel));

  kolom.forEach((nama) => el("th", nama, barisHead));
  return el("tbody", "", tabel);
}

function isiBaris(tbody, nilai) {
  const baris = el("tr", "", tbody);
  nilai.forEach((v) => el("td", v, baris));
}

function renderPanel() {
  const panel = $("#panel");
  const menu = location.hash;
  panel.innerHTML = "";

  if (!menu) {
    el("p", "Pilih menu Laporan atau Histori Transaksi di navigasi atas.", panel);
    return;
  }

  if (menu === "#rekap") {
    const tbody = buatTabel(panel, "Rekap Bahan Ajar", ["Kode", "Nama", "Jenis", "Stok"]);
    dataBahanAjar.forEach((b) => {
      isiBaris(tbody, [b.kodeBarang, b.namaBarang, b.jenisBarang, b.stok]);
    });

    const total = dataBahanAjar.reduce((sum, b) => sum + Number(b.stok), 0);
    el("p", "Total stok: " + total + " eksemplar", panel);
    return;
  }

  const monitoring = menu === "#monitoring";
  const tbody = monitoring
    ? buatTabel(panel, "Monitoring Progress DO", ["No. DO", "Nama", "Status", "Progress"])
    : buatTabel(panel, "Histori Transaksi Bahan Ajar", ["No. DO", "Nama", "Tanggal Kirim", "Ekspedisi", "Total"]);

  Object.keys(dataTracking).forEach((noDO) => {
    const d = dataTracking[noDO];
    isiBaris(
      tbody,
      monitoring
        ? [noDO, d.nama, d.status, hitungProgress(d) + "%"]
        : [noDO, d.nama, d.tanggalKirim, d.ekspedisi, d.total]
    );
  });
}

function initDashboard() {
  $("#greeting").textContent = `Selamat ${getGreeting()}, ${user.nama}!`;
  $("#info").textContent = `${user.role} - ${user.lokasi}`;

  window.addEventListener("hashchange", renderPanel);
  renderPanel();
}

/*HALAMAN TRACKING*/
function renderTracking(noDO, data) {
  const hasil = $("#hasil");

  // Kartu ringkasan: nama, status, progress bar, detail
  const kartu = el("div", "", hasil);
  kartu.className = "card";
  el("h3", data.nama, kartu);
  el("span", data.status, kartu).className = "badge";

  const bar = el("div", "", kartu);
  bar.className = "bar";
  bar.innerHTML = `<i style="width:${hitungProgress(data)}%"></i>`;

  const grid = el("div", "", kartu);
  grid.className = "grid";
  [
    ["Ekspedisi", data.ekspedisi],
    ["Tanggal kirim", data.tanggalKirim],
    ["Jenis paket", data.paket],
    ["Total pembayaran", data.total],
  ].forEach(([label, isi]) => {
    const item = el("div", "", grid);
    el("b", label, item);
    el("span", isi, item);
  });

  // Kartu timeline perjalanan (terbaru di atas)
  const kartuTl = el("div", "", hasil);
  kartuTl.className = "card";
  el("h3", "Perjalanan Paket", kartuTl);

  const daftar = el("ul", "", kartuTl);
  daftar.className = "tl";

  data.perjalanan
    .slice()
    .sort((a, b) => b.waktu.localeCompare(a.waktu))
    .forEach((p) => {
      const li = el("li", p.keterangan, daftar);
      el("small", p.waktu, li);
    });
}

function initTracking() {
  $("#formCari").addEventListener("submit", (e) => {
    e.preventDefault();
    const noDO = $("#noDO").value.trim();

    $("#hasil").innerHTML = "";
    $("#errCari").textContent = "";

    if (!noDO) {
      return showError("#errCari", "Nomor Delivery Order wajib diisi.");
    }
    if (!dataTracking[noDO]) {
      return showError("#errCari", `Nomor DO ${noDO} tidak ditemukan.`);
    }

    renderTracking(noDO, dataTracking[noDO]);
  });
}

/*HALAMAN STOK*/
function tambahBarisStok(item) {
  const baris = el("tr", "", $("#tbStok"));

  // Kolom cover: jika gambar tidak ada, tampil kotak abu-abu
  const img = el("img", "", el("td", "", baris));
  img.className = "cover";
  img.alt = "Cover " + item.namaBarang;
  if (item.cover) img.src = item.cover;
  img.onerror = () => img.removeAttribute("src");

  [item.kodeLokasi, item.kodeBarang, item.namaBarang, item.jenisBarang, item.edisi, item.stok]
    .forEach((v) => el("td", v, baris));
}

function initStok() {
  dataBahanAjar.forEach(tambahBarisStok);

  $("#formStok").addEventListener("submit", (e) => {
    e.preventDefault();

    const item = {
      kodeLokasi: $("#fLok").value.trim(),
      kodeBarang: $("#fKode").value.trim(),
      namaBarang: $("#fNama").value.trim(),
      jenisBarang: $("#fJenis").value,
      edisi: $("#fEdisi").value,
      stok: $("#fStok").value,
      cover: "",
    };

    // Validasi
    const kosong = !item.kodeLokasi || !item.kodeBarang || !item.namaBarang || !item.edisi || item.stok === "";
    if (kosong) return showError("#errStok", "Semua kolom wajib diisi.");
    if (Number(item.stok) < 0) return showError("#errStok", "Stok tidak boleh negatif.");
    if (dataBahanAjar.some((b) => b.kodeBarang === item.kodeBarang)) {
      return showError("#errStok", "Kode barang sudah ada.");
    }

    // Simpan ke array lalu tampilkan baris baru
    item.stok = Number(item.stok);
    dataBahanAjar.push(item);
    tambahBarisStok(item);

    $("#errStok").textContent = "";
    e.target.reset();
    alert("Stok baru berhasil ditambahkan.");
  });
}

/*JALANKAN SESUAI HALAMAN*/
const inisialisasi = {
  login: initLogin,
  dashboard: initDashboard,
  tracking: initTracking,
  stok: initStok,
};

if (inisialisasi[page]) inisialisasi[page]();
