function konversi(jumlah, satuanAwal, satuanTujuan) {
  const normalisasi = (s) => {
    if (s === 'gram') return 'g';
    if (s === 'kilogram') return 'kg';
    if (s === 'liter') return 'l';
    if (s === 'mililiter') return 'ml';
    return s;
  };

  satuanAwal = normalisasi(satuanAwal);
  satuanTujuan = normalisasi(satuanTujuan);

  const faktor = {
    'kg-g': 1000,
    'g-kg': 0.001,
    'l-ml': 1000,
    'ml-l': 0.001,
    'pcs-pcs': 1,
    'g-g': 1,
    'kg-kg': 1,
    'ml-ml': 1,
    'l-l': 1
  };

  return jumlah * (faktor[`${satuanAwal}-${satuanTujuan}`] || 1);
}

module.exports = konversi;
