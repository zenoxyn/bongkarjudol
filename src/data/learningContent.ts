import { CONTENT_VERSION } from '../engine/config.ts';

export interface LearningMaterial {
  order: number;
  slug: string;
  title: string;
  subtitle: string;
  readTimeMinutes: number;
  summary: string;
  sections: Array<{
    heading: string;
    body: string;
    formula?: string;
    example?: string;
  }>;
  keyTakeaway: string;
}

export interface QuizOption {
  key: string;
  text: string;
}

export interface QuizQuestion {
  questionKey: string;
  topicSlug: string;
  topicTitle: string;
  prompt: string;
  options: QuizOption[];
  correctOptionKey: string;
  explanation: string;
}

export type PublicQuizQuestion = Omit<
  QuizQuestion,
  'correctOptionKey' | 'explanation'
>;

export const LEARNING_MATERIALS: readonly LearningMaterial[] = [
  {
    order: 1,
    slug: 'rng-dan-independensi',
    title: '01. Mesin Tidak Punya Ingatan',
    subtitle: 'Kenapa hasil putaran barusan tidak mengubah peluang putaran berikutnya',
    readTimeMinutes: 2,
    summary:
      'Setiap kali tombol Putar ditekan, komputer mengocok ulang 30 kotak dari nol. Mesin tidak ingat apakah Anda barusan kalah 10 kali atau baru menang.',
    sections: [
      {
        heading: 'Sama Seperti Kocokan Arisan atau Lempar Koin',
        body: 'Bayangkan melempar koin uang logam. Biarpun 5 kali berturut-turut yang keluar sisi "Gambar", di lemparan ke-6 peluang keluar "Angka" tetap 50-50—tidak jadi lebih besar. Mesin slot bekerja persis seperti itu: tiap putaran mengocok 30 kotak secara acak dan terpisah.',
      },
      {
        heading: 'Mitos "Mesin Lagi Panas" atau "Sebentar Lagi Pecah"',
        body: 'Banyak orang percaya kalau sudah kalah banyak, mesin akan "kasihan" lalu gantian memberi jackpot. Itu salah besar. Komputer di server tidak mencatat utang kekalahan Anda—setiap putaran selalu dimulai dari nol lagi.',
        formula: 'Putaran baru = Kocokan baru dari nol (tidak peduli kalah/menang sebelumnya)',
        example:
          'Peluang dapat Putaran Gratis cuma sekitar 2 dari 100 putaran. Meski Anda sudah 30 kali memutar tanpa dapat bonus, peluang di putaran ke-31 tetap cuma 2 dari 100.',
      },
    ],
    keyTakeaway:
      'Tidak ada istilah "jam gacor", "mesin panas", atau "waktunya balik modal". Semua itu cuma mitos yang bikin orang terus setor uang.',
  },
  {
    order: 2,
    slug: 'bobot-simbol-dan-probabilitas',
    title: '02. Gambar Zonk Sengaja Dibuat Paling Banyak',
    subtitle: 'Kenapa gambar kecil dan gambar kosong memenuhi layar',
    readTimeMinutes: 2,
    summary:
      'Tidak semua gambar punya jatah muncul yang sama. Hampir separuh isi layar sengaja diisi gambar kosong (Daun dan Bulan) yang tidak memberi hadiah.',
    sections: [
      {
        heading: 'Ibarat 100 Kartu di Dalam Topi',
        body: 'Bayangkan ada 100 kartu di dalam topi untuk mengisi tiap kotak: 21 kartu gambar Daun (kosong) dan 21 kartu gambar Bulan (kosong). Jadi 42 dari 100 kartu itu ZONK—hampir separuh layar sering terisi gambar yang tidak membayar sama sekali!',
      },
      {
        heading: 'Kenapa Gambar Hadiah Besar Susah Terkumpul',
        body: 'Gambar Mahkota (hadiah paling tinggi) cuma dapat jatah 9 kartu dari 100, dan Bintang Bonus cuma 2 kartu dari 100. Untuk menang, Anda butuh minimal 8 gambar yang sama di layar. Padahal rata-rata Mahkota yang keluar di 30 kotak cuma 2 sampai 3 buah!',
        formula: 'Jatah Zonk (Daun + Bulan) = 42 dari 100  |  Bintang Bonus = cuma 2 dari 100',
        example:
          'Sering lihat banyak gambar Mahkota bertebaran di layar? Biasanya jumlahnya cuma 5–7 buah—sengaja bikin perasaan "dikit lagi menang", padahal tetap tidak dapat apa-apa.',
      },
    ],
    keyTakeaway:
      'Tampilan "hampir dapat 8 gambar bagus" atau "kurang 1 bintang lagi" terjadi karena jatah peluangnya memang diatur sangat tipis oleh pembuat mesin.',
  },
  {
    order: 3,
    slug: 'cluster-dan-alokasi-wild',
    title: '03. Syarat Menang & Cara Kerja Gambar Wild',
    subtitle: 'Harus terkumpul minimal 8 gambar sama di mana saja pada layar',
    readTimeMinutes: 2,
    summary:
      'Menang tidak harus berbaris lurus—yang penting jumlah gambarnya minimal 8 buah di layar. Gambar Wild bisa membantu melengkapi 1 jenis gambar saja.',
    sections: [
      {
        heading: 'Minimal 8 Gambar Sama Baru Keluar Hadiah',
        body: 'Mesin menghitung total gambar Cherry, Bell, Gem, atau Crown di seluruh 30 kotak. Kalau cuma ada 6 atau 7 gambar, dianggap kalah (0 koin). Hadiah baru keluar kalau terkumpul 8–9 buah, 10–11 buah, atau 12+ buah.',
      },
      {
        heading: 'Aturan Gambar Pengganti (Wild)',
        body: 'Gambar Wild (jatah muncul cuma 5%) bisa menggantikan gambar yang kurang. Tapi ingat: 1 gambar Wild hanya bisa menolong 1 jenis gambar yang hadiahnya paling besar—tidak bisa dipakai bersamaan untuk dua jenis gambar.',
        example:
          'Misalnya ada 7 Gem, 7 Cherry, dan 1 Wild. Mesin otomatis pakai Wild itu untuk melengkapi Gem jadi 8 buah, sedangkan Cherry tetap 7 buah (tidak menang).',
      },
    ],
    keyTakeaway:
      'Walau gambar Wild terlihat membantu, kemunculannya sangat dibatasi (cuma 5%) sehingga tetap jarang menyelamatkan putaran.',
  },
  {
    order: 4,
    slug: 'mekanisme-tumble',
    title: '04. Efek Gambar Runtuh (Tumble) & Batasnya',
    subtitle: 'Kenapa animasi jatuh beruntun sering bikin ketagihan menunggu',
    readTimeMinutes: 2,
    summary:
      'Saat ada gambar menang, gambar itu pecah lalu gambar baru jatuh dari atas. Tapi proses ini dibatasi maksimal 5 kali runtuh dalam satu putaran.',
    sections: [
      {
        heading: 'Gambar Baru Tetap Punya Peluang Zonk 42%',
        body: 'Ketika gambar yang menang pecah dan menghilang, kotak yang kosong langsung diisi kocokan baru dari atas. Banyak orang mengira runtuhan ini bisa lanjut terus sampai kaya—padahal gambar baru yang jatuh tetap punya 42% kemungkinan berupa Daun/Bulan yang kosong.',
      },
      {
        heading: 'Dibatasi Maksimal 5 Kali Runtuh',
        body: 'Dalam satu putaran, layar dibatasi maksimal hanya boleh runtuh 5 kali. Dan dari uji coba 100.000 kali putar, rata-rata satu putaran bahkan tidak sampai 1 kali runtuh (cuma ~0,67 kali).',
        example:
          'Lebih dari separuh putaran (56 dari 100 kali tekan) langsung berhenti kosong tanpa satu kali pun gambar runtuh.',
      },
    ],
    keyTakeaway:
      'Animasi gambar pecah dan jatuh beruntun dibuat seru supaya mata terpaku dan tangan tergoda memencet Putar lagi.',
  },
  {
    order: 5,
    slug: 'multiplier-aditif',
    title: '05. Bola Pengali: Dijumlahkan, Bukan Dikalikan',
    subtitle: 'Jangan salah paham melihat bola 2× dan 3× muncul bersamaan',
    readTimeMinutes: 2,
    summary:
      'Jika muncul dua bola pengali saat menang, angkanya dijumlahkan (2 + 3 = 5×), bukan dikali silang (bukan 6×). Kalau tidak ada gambar menang, bola pengali langsung hangus.',
    sections: [
      {
        heading: 'Hangus Kalau Tidak Ada yang Menang',
        body: 'Sering melihat bola 5× jatuh ke layar tapi koin tidak bertambah? Itu karena bola pengali hanya berlaku kalau di layar yang sama ada minimal 8 gambar yang menang. Kalau tidak ada yang menang, bola pengali langsung hilang sia-sia.',
      },
      {
        heading: 'Cara Hitung yang Sebenarnya',
        body: 'Kalau Anda menang hadiah awal 10 koin lalu muncul bola 2× dan 3× dalam rangkaian yang sama, total pengalinya adalah 2 + 3 = 5× (jadi 50 koin), bukan 2 × 3 = 6× (60 koin).',
        formula: 'Hadiah Akhir = Hadiah Awal × (Jumlah Semua Angka Bola Pengali)',
        example:
          'Hadiah awal 10 koin + bola 2× + bola 3× → Pengali jadi 5× → Total hadiah 50 koin.',
      },
    ],
    keyTakeaway:
      'Bola pengali besar sering muncul justru saat tidak ada gambar pemenang—memberi kesan palsu bahwa "sebentar lagi pasti meledak".',
  },
  {
    order: 6,
    slug: 'scatter-dan-free-spins',
    title: '06. Bintang Bonus (Scatter) & Putaran Gratis',
    subtitle: 'Kenapa "Putaran Gratis" dan "Beli Scatter" tetap bikin rugi',
    readTimeMinutes: 3,
    summary:
      'Minimal 3 Bintang Bonus di layar awal memberi 10–15 Putaran Gratis. Hadiah bonus ini sudah dihitung agar rata-rata pemain tetap kalah.',
    sections: [
      {
        heading: 'Sangat Jarang Muncul Alami',
        body: 'Karena jatah Bintang Bonus cuma 2 dari 100 kotak, peluang keluar 3 bintang sekaligus hanya sekitar 2%—kira-kira baru muncul 1 kali setiap 45 kali putar berbayar.',
      },
      {
        heading: 'Putaran Gratis Dibayar dari Kekalahan Sebelumnya',
        body: 'Meskipun disebut "gratis", seluruh hadiah dari Putaran Gratis sudah dimasukkan ke dalam hitungan mesin. Artinya, hadiah gratis 30 koin sering kali datang setelah sebelumnya saldo Anda sudah habis 100 koin. Begitu juga fitur "Beli Scatter": harganya mahal (500 koin), dan sering kali hadiah yang keluar jauh lebih kecil dari 500 koin!',
        example:
          'Beli Scatter habis 500 koin, dapat 10 Putaran Gratis, lalu total hadiahnya cuma keluar 180 koin → Anda langsung rugi 320 koin dalam sekejap!',
      },
    ],
    keyTakeaway:
      'Coba fitur "Edukasi Scatter" dan "Beli Scatter" di simulator untuk melihat sendiri betapa seringnya bonus gratis pun tetap memberi hasil rugi.',
  },
  {
    order: 7,
    slug: 'gross-payout-vs-net-profit',
    title: '07. Layar Bilang "Menang!", Padahal Aslinya Rugi',
    subtitle: 'Trik paling sering bikin pemain merasa hampir untung',
    readTimeMinutes: 2,
    summary:
      'Kalau taruhan Anda 20 koin lalu dapat hadiah 4 koin, layar tetap merayakan "MENANG 4 KOIN!" padahal uang Anda berkurang 16 koin.',
    sections: [
      {
        heading: 'Mengenal Trik "Menang Palsu"',
        body: 'Ini adalah trik psikologi paling ampuh di mesin slot. Setiap kali hadiah keluar lebih kecil dari modal taruhan, lampu berkedip dan musik menang tetap berbunyi—otak Anda mengira baru saja menang, padahal saldo makin turun.',
        formula: 'Untung/Rugi Asli = Hadiah yang Masuk − Taruhan yang Keluar',
        example:
          'Pasang taruhan 20 koin, keluar hadiah Cherry 4 koin → Uang Anda sebenarnya hilang −16 koin (tetap rugi!).',
      },
      {
        heading: 'Fakta Mengejutkan dari 100.000 Putaran',
        body: 'Dari 100 kali memutar: sekitar 44 kali layar memang mengeluarkan hadiah (> 0), tapi yang hadiahnya benar-benar lebih besar dari taruhan cuma sekitar 18 kali! Sisanya 80 kali bikin rugi (atau impas ~1 kali).',
      },
    ],
    keyTakeaway:
      'Jangan pernah tertipu suara meriah atau tulisan "MENANG!". Selalu cek: hadiah yang masuk lebih besar atau lebih kecil dari uang yang barusan dipasang?',
  },
  {
    order: 8,
    slug: 'rtp-teoretis-vs-observasi',
    title: '08. Uang Kembali (RTP): Kenapa Main Lama Pasti Terkuras',
    subtitle: 'Bedanya untung sebentar di awal dengan hasil kalau terus main',
    readTimeMinutes: 3,
    summary:
      'Persentase uang kembali (RTP) di mesin ini sekitar 75%. Artinya, makin sering memutar, makin mendekati kehilangan seperempat dari total taruhan Anda.',
    sections: [
      {
        heading: 'Apa Itu Angka Uang Kembali (RTP)?',
        body: 'RTP artinya dari seluruh uang taruhan yang masuk ke mesin dalam jangka panjang, berapa persen yang dibagikan lagi sebagai hadiah. Pada mesin ini, dari 100.000 kali uji coba, uang yang kembali rata-rata adalah 75,2%—jadi tidak pernah 100%.',
        formula: 'Uang Kembali (RTP) = (Total Hadiah ÷ Total Taruhan) × 100%',
      },
      {
        heading: 'Kenapa Baru Main Sebentar Bisa Untung?',
        body: 'Kalau cuma main 10 atau 20 kali, orang bisa saja kebetulan dapat hadiah besar lalu untung sementara. Bandar sengaja membiarkan ini terjadi agar pemain ketagihan dan cerita ke teman. Tapi begitu terus bermain ratusan kali, hukum rata-rata bekerja dan saldo pasti turun mengikuti angka ~75%.',
        example:
          'Bayangkan taruhan total Rp100.000 secara berulang: rata-rata yang balik ke kantong cuma Rp75.200, sedangkan Rp24.800 hilang.',
      },
    ],
    keyTakeaway:
      'Menang di awal permainan itu umpan kebetulan. Jika Anda terus bermain, makin banyak putaran maka makin pasti saldo mendekati rugi.',
  },
  {
    order: 9,
    slug: 'house-edge-dan-expected-value',
    title: '09. Jatah Pasti Bandar & Bahaya Uang Diputar Terus',
    subtitle: 'Kenapa modal Rp100 ribu bisa habis dimakan jatah bandar',
    readTimeMinutes: 3,
    summary:
      'Selama uang kembali di bawah 100%, bandar selalu mengambil potongan tiap kali tombol ditekan. Makin sering memutar, makin besar total yang terpotong.',
    sections: [
      {
        heading: 'Menghitung Potongan Bandar',
        body: 'Kalau uang kembali (RTP) 75,2%, berarti sisa 24,8%-nya adalah Jatah Pasti Bandar. Bahasa mudahnya: setiap Anda memasang taruhan 100 koin, secara rata-rata langsung hilang sekitar 25 koin ke sistem.',
        formula: 'Potongan Bandar = 100% − 75,2% = 24,8%  (hilang ~25 tiap 100 koin)',
        example:
          'Kalau Anda pasang 100 koin per putaran, rata-rata Anda kehilangan ~25 koin setiap sekali pencet tombol Putar.',
      },
      {
        heading: 'Bahaya Uang yang Diputar Berulang-ulang',
        body: 'Banyak yang mengira kalau bawa modal 1.000 koin, paling-paling cuma kena potongan dari 1.000 koin itu. Salah! Kalau Anda memutar 100 kali dengan taruhan 20 koin (menang sedikit lalu diputar lagi), total uang yang masuk ke mesin menjadi 2.000 koin. Potongan bandar ~25% memakan dari total 2.000 koin itu (= ~500 koin hilang)!',
      },
    ],
    keyTakeaway:
      'Memutar ulang uang kemenangan kecil membuat total taruhan terus membengkak, dan potongan bandar perlahan menghabiskan seluruh modal Anda.',
  },
  {
    order: 10,
    slug: 'variansi-dan-bias-kognitif',
    title: '10. Jebakan Pikiran yang Bikin Susah Berhenti',
    subtitle: 'Mengenali rasa "penasaran mau balik modal" sebelum terlambat',
    readTimeMinutes: 3,
    summary:
      'Rasa tidak rela uang hilang, tampilan "nyaris jackpot", dan ingatan saat pernah menang kecil menipu otak untuk terus bermain sampai habis-habisan.',
    sections: [
      {
        heading: 'Jebakan "Nanggung, Sekali Lagi Pasti Balik Modal"',
        body: 'Saat sudah kalah banyak, perasaan kecewa membuat orang nekat menaikkan taruhan atau pinjam uang (mengejar kekalahan) dengan harapan satu kali menang besar bisa menutup semua rugi. Padahal setiap putaran baru tetap merugikan rata-rata ~25%, sehingga menaikkan taruhan justru mempercepat bangkrut.',
      },
      {
        heading: 'Kenapa Otak Mudah Tertipu?',
        body: '1) Ilusi nyaris menang: muncul 2 Bintang Bonus (kurang 1 lagi!) bikin jantung berdebar seolah jackpot sudah di depan mata. 2) Menang palsu: suara meriah walau hadiah lebih kecil dari taruhan bikin lupa kalau saldo terus berkurang. 3) Ingat menangnya, lupa kalahnya.',
      },
    ],
    keyTakeaway:
      'Satu-satunya cara menang melawan sistem slot adalah tidak memulainya—atau berhenti sekarang sebelum uang kebutuhan keluarga ikut tergerus.',
  },
] as const;

export const PRE_TEST_QUESTIONS: readonly QuizQuestion[] = [
  {
    questionKey: 'pre-q1',
    topicSlug: 'rng-dan-independensi',
    topicTitle: 'Mesin Tidak Punya Ingatan',
    prompt:
      'Misalnya Anda sudah kalah 15 kali berturut-turut saat main slot. Menurut Anda, bagaimana peluang menang di putaran ke-16?',
    options: [
      { key: 'a', text: 'Peluang menang lebih besar karena mesin mau bayar utang kekalahan' },
      { key: 'b', text: 'Sama saja seperti putaran sebelumnya, karena mesin mengacak ulang dari nol' },
      { key: 'c', text: 'Peluang lebih kecil karena akun lagi jelek / dingin' },
      { key: 'd', text: 'Berubah jadi lebih besar kalau menaikkan taruhan' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Mesin tidak punya ingatan sama sekali. Setiap kali tombol ditekan, komputer mengacak ulang dari nol sehingga peluang menangnya tetap sama.',
  },
  {
    questionKey: 'pre-q2',
    topicSlug: 'bobot-simbol-dan-probabilitas',
    topicTitle: 'Gambar Zonk Paling Banyak',
    prompt:
      'Di mesin ini, gambar kosong Daun (21%) dan Bulan (21%) dibuat sangat sering muncul (42% dari seluruh kotak). Untuk apa dibuat begitu?',
    options: [
      { key: 'a', text: 'Supaya pemain pasti dapat putaran gratis tiap 10 kali putar' },
      { key: 'b', text: 'Supaya gambar hadiah susah terkumpul minimal 8 buah untuk menang' },
      { key: 'c', text: 'Supaya otomatis menggandakan hadiah di akhir putaran' },
      { key: 'd', text: 'Supaya bisa menggantikan semua gambar lain seperti Wild' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Daun dan Bulan itu gambar kosong (zonk). Makin banyak kotak diisi gambar kosong, makin jarang gambar hadiah bisa terkumpul 8 buah.',
  },
  {
    questionKey: 'pre-q3',
    topicSlug: 'cluster-dan-alokasi-wild',
    topicTitle: 'Syarat Menang & Gambar Wild',
    prompt:
      'Syarat menang adalah minimal 8 gambar sama. Jika di layar ada 7 Gem, 7 Cherry, dan 1 gambar Wild (pengganti), apa yang terjadi?',
    options: [
      { key: 'a', text: '1 Wild dipakai untuk melengkapi Gem dan Cherry dua-duanya sekaligus' },
      { key: 'b', text: '1 Wild hanya dipakai melengkapi 1 gambar yang hadiahnya paling besar (Gem)' },
      { key: 'c', text: '1 Wild wajib dipakai untuk Cherry saja' },
      { key: 'd', text: 'Wild langsung berubah menjadi Bintang Bonus' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Satu gambar Wild cuma boleh menolong satu jenis gambar saja, dan mesin memilihkan gambar dengan bayaran lebih tinggi (Gem).',
  },
  {
    questionKey: 'pre-q4',
    topicSlug: 'multiplier-aditif',
    topicTitle: 'Cara Hitung Bola Pengali',
    prompt:
      'Misalnya Anda menang hadiah awal 10 koin, lalu ada bola pengali 2× dan 3× di layar yang sama. Berapa total hadiah yang didapat?',
    options: [
      { key: 'a', text: '60 koin (karena 10 × 2 × 3)' },
      { key: 'b', text: '50 koin (karena bola pengali dijumlahkan dulu: 2 + 3 = 5×, lalu 10 × 5)' },
      { key: 'c', text: '15 koin (karena cuma ditambah: 10 + 2 + 3)' },
      { key: 'd', text: '10 koin saja karena bola pengali tidak dihitung' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Bola pengali yang muncul saat menang dijumlahkan angkanya (2 + 3 = 5×), bukan dikalikan (bukan 6×). Jadi 10 × 5 = 50 koin.',
  },
  {
    questionKey: 'pre-q5',
    topicSlug: 'gross-payout-vs-net-profit',
    topicTitle: 'Layar Menang Padahal Rugi',
    prompt:
      'Anda pasang taruhan 20 koin, lalu layar menyala meriah memberi hadiah 8 koin. Sebenarnya bagaimana uang Anda pada putaran itu?',
    options: [
      { key: 'a', text: 'Untung bersih +8 koin' },
      { key: 'b', text: 'Impas karena layar bilang menang' },
      { key: 'c', text: 'Tetap rugi bersih 12 koin (karena 8 − 20 = −12)' },
      { key: 'd', text: 'Untung bersih +28 koin' },
    ],
    correctOptionKey: 'c',
    explanation:
      'Keluar 20 koin tapi cuma balik 8 koin berarti Anda tetap rugi 12 koin. Musik dan lampu meriah hanyalah jebakan agar terasa seperti menang.',
  },
  {
    questionKey: 'pre-q6',
    topicSlug: 'rtp-teoretis-vs-observasi',
    topicTitle: 'Uang Kembali (RTP)',
    prompt:
      'Kalau mesin punya aturan uang kembali (RTP) sekitar 75%, apa artinya bagi orang yang baru main 20 kali putaran?',
    options: [
      { key: 'a', text: 'Pasti dapat kembali pas 75% uangnya di 20 putaran itu' },
      { key: 'b', text: 'Hasil 20 putaran bisa saja untung atau rugi jauh karena masih terlalu sedikit' },
      { key: 'c', text: 'Di putaran ke-21 pasti dikasih sisa 25%-nya' },
      { key: 'd', text: 'Pasti untung 75% dari modal awal' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Angka 75% adalah rata-rata setelah ratusan ribu putaran. Kalau baru main 20 kali, hasilnya masih bisa naik-turun sangat jauh.',
  },
  {
    questionKey: 'pre-q7',
    topicSlug: 'house-edge-dan-expected-value',
    topicTitle: 'Potongan Bandar',
    prompt:
      'Jika rata-rata uang kembali (RTP) adalah 75% dan Anda bertaruh 100 koin tiap putaran, berapa potongan bandar dan rata-rata rugi per putaran?',
    options: [
      { key: 'a', text: 'Potongan bandar 75%, pemain rata-rata untung +25 koin' },
      { key: 'b', text: 'Potongan bandar 25%, pemain rata-rata hilang −25 koin tiap putaran' },
      { key: 'c', text: 'Potongan bandar 25%, pemain rata-rata untung +25 koin' },
      { key: 'd', text: 'Potongan bandar 0%, selalu impas' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Potongan bandar adalah 100% − 75% = 25%. Jadi setiap taruhan 100 koin, rata-rata 25 koin hilang ke bandar.',
  },
  {
    questionKey: 'pre-q8',
    topicSlug: 'variansi-dan-bias-kognitif',
    topicTitle: 'Jebakan Pikiran Pemain',
    prompt:
      'Kebiasaan terus main atau menaikkan taruhan semata-mata karena penasaran ingin mengembalikan uang yang baru kalah disebut...',
    options: [
      { key: 'a', text: 'Trik aman melipatgandakan modal' },
      { key: 'b', text: 'Mengejar kekalahan (chasing losses) yang justru mempercepat habisnya uang' },
      { key: 'c', text: 'Menunggu jam gacor' },
      { key: 'd', text: 'Cara membaca pola mesin' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Mengejar kekalahan membuat uang yang dipertaruhkan makin besar pada sistem yang rata-ratanya memang menggerus saldo.',
  },
] as const;

export const POST_TEST_QUESTIONS: readonly QuizQuestion[] = [
  {
    questionKey: 'post-q1',
    topicSlug: 'rng-dan-independensi',
    topicTitle: 'Mesin Tidak Punya Ingatan',
    prompt:
      'Teman Anda sudah kalah 10 kali berturut-turut, lalu bilang "Sebentar lagi pasti pecah, lanjut aja!". Mengapa perkataan itu keliru?',
    options: [
      { key: 'a', text: 'Karena tiap putaran diacak baru dari nol dan mesin tidak ingat kekalahan sebelumnya' },
      { key: 'b', text: 'Karena mesin baru memberi hadiah setelah putaran ke-20' },
      { key: 'c', text: 'Karena taruhan kecil dilarang menang di putaran ke-11' },
      { key: 'd', text: 'Karena kemenangan hanya muncul di malam hari' },
    ],
    correctOptionKey: 'a',
    explanation:
      'Mengira kekalahan beruntun membuat kemenangan makin dekat adalah jebakan pikiran. Peluang tiap putaran selalu sama.',
  },
  {
    questionKey: 'post-q2',
    topicSlug: 'bobot-simbol-dan-probabilitas',
    topicTitle: 'Gambar Zonk Paling Banyak',
    prompt:
      'Mengapa gambar Mahkota (peluang 9%) jauh lebih jarang terkumpul minimal 8 buah dibanding gambar Cherry (peluang 15%)?',
    options: [
      { key: 'a', text: 'Karena jatah peluang Mahkota tiap kotak jauh lebih kecil sehingga rata-rata munculnya cuma 2–3 buah' },
      { key: 'b', text: 'Karena Mahkota hanya muncul di baris paling atas' },
      { key: 'c', text: 'Karena Cherry cuma butuh 4 gambar untuk menang' },
      { key: 'd', text: 'Karena Mahkota selalu dihapus oleh gambar Daun' },
    ],
    correctOptionKey: 'a',
    explanation:
      'Dalam 30 kotak, rata-rata Mahkota hanya muncul sekitar 2–3 buah—sangat jauh dari syarat minimal 8 buah.',
  },
  {
    questionKey: 'post-q3',
    topicSlug: 'cluster-dan-alokasi-wild',
    topicTitle: 'Syarat Menang & Gambar Wild',
    prompt:
      'Di layar ada 10 Cherry, 7 Bell, dan 1 gambar Wild. Ke mana mesin memakai gambar Wild tersebut?',
    options: [
      { key: 'a', text: 'Tidak dipakai karena Cherry sudah menang' },
      { key: 'b', text: 'Dipakai melengkapi 7 Bell jadi 8 Bell agar dapat tambahan hadiah, karena Cherry butuh 2 Wild untuk naik tingkat' },
      { key: 'c', text: 'Dipakai untuk Cherry dan Bell dua-duanya' },
      { key: 'd', text: 'Langsung dihapus sebelum hadiah dihitung' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Menambahkan 1 Wild ke 7 Bell langsung membuatnya jadi 8 Bell (menang baru!), sedangkan 10 Cherry ditambah 1 jadi 11 belum cukup naik ke tingkat 12+.',
  },
  {
    questionKey: 'post-q4',
    topicSlug: 'multiplier-aditif',
    topicTitle: 'Cara Hitung Bola Pengali',
    prompt:
      'Di layar muncul bola pengali 5×, tetapi tidak ada satu pun gambar yang terkumpul minimal 8 buah (tidak ada yang menang). Apa yang terjadi pada bola 5× itu?',
    options: [
      { key: 'a', text: 'Disimpan untuk putaran berikutnya' },
      { key: 'b', text: 'Hangus (bernilai 0) karena tidak ada kombinasi menang di layar itu' },
      { key: 'c', text: 'Berubah menjadi 10× di putaran depan' },
      { key: 'd', text: 'Tetap memberi hadiah 5 koin' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Bola pengali hanya dihitung kalau ada gambar menang di layar yang sama. Kalau zonk, bola pengali langsung hangus.',
  },
  {
    questionKey: 'post-q5',
    topicSlug: 'gross-payout-vs-net-profit',
    topicTitle: 'Layar Menang Padahal Rugi',
    prompt:
      'Setelah selesai bermain, total taruhan yang Anda pasang adalah 500 koin dan total hadiah yang keluar 380 koin. Mana pernyataan yang benar?',
    options: [
      { key: 'a', text: 'Anda untung 380 koin karena sering dapat hadiah' },
      { key: 'b', text: 'Anda tetap rugi bersih 120 koin (uang balik cuma 76% dari taruhan)' },
      { key: 'c', text: 'Saldo Anda bertambah 380 koin dari modal awal' },
      { key: 'd', text: 'Bandar mengalami kerugian' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Uang yang keluar 500 koin, yang balik 380 koin → bersihnya tetap rugi −120 koin (pengembalian 76%).',
  },
  {
    questionKey: 'post-q6',
    topicSlug: 'rtp-teoretis-vs-observasi',
    topicTitle: 'Uang Kembali (RTP)',
    prompt:
      'Mengapa hasil uji coba 100.000 putaran tetap menyebut angka perkiraan rata-rata, bukan janji pasti untuk tiap orang?',
    options: [
      { key: 'a', text: 'Untuk meramal jam berapa mesin akan jackpot' },
      { key: 'b', text: 'Karena angka itu rata-rata jangka panjang, sedangkan hasil main sebentar sangat acak dan naik-turun' },
      { key: 'c', text: 'Supaya taruhan maksimal dibatasi 100' },
      { key: 'd', text: 'Agar modal awal selalu kembali 100%' },
    ],
    correctOptionKey: 'b',
    explanation:
      'Angka uji 100.000 putaran hanya menunjukkan rata-rata jangka panjang mesin, bukan jaminan apa yang terjadi pada satu kali main sebentar.',
  },
  {
    questionKey: 'post-q7',
    topicSlug: 'house-edge-dan-expected-value',
    topicTitle: 'Potongan Bandar',
    prompt:
      'Mengapa memutar 100 kali dengan taruhan 20 koin (total uang diputar 2.000 koin) ruginya jauh lebih besar dibanding cuma memutar 10 kali?',
    options: [
      { key: 'a', text: 'Karena potongan bandar memakan dari total uang yang terus diputar (2.000 koin), bukan cuma dari modal awal' },
      { key: 'b', text: 'Karena mesin memblokir hadiah setelah 50 putaran' },
      { key: 'c', text: 'Karena Bintang Bonus cuma ada di 10 putaran pertama' },
      { key: 'd', text: 'Karena taruhan 20 otomatis hangus di atas 50 putaran' },
    ],
    correctOptionKey: 'a',
    explanation:
      'Makin sering Anda memutar ulang koin, makin besar total uang taruhan yang terkena potongan bandar (~25%).',
  },
  {
    questionKey: 'post-q8',
    topicSlug: 'variansi-dan-bias-kognitif',
    topicTitle: 'Jebakan Pikiran Pemain',
    prompt:
      'Ada orang kemarin menang besar di 15 putaran pertama, lalu yakin ia sudah menemukan "pola gacor" untuk menang lagi hari ini. Penjelasan paling tepat adalah...',
    options: [
      { key: 'a', text: 'Kemenangan kemarin cuma kebetulan sesaat dalam jumlah putaran kecil, bukan pola sakti yang bisa mengalahkan mesin' },
      { key: 'b', text: 'Main di jam yang sama pasti memberi Bintang Bonus lagi' },
      { key: 'c', text: 'Mesin memang memberi untung pasti di hari tertentu' },
      { key: 'd', text: 'Mesin mengenali pemain yang memakai pola tertentu' },
    ],
    correctOptionKey: 'a',
    explanation:
      'Hasil acak dalam putaran sedikit memang kadang bikin untung sesaat, tapi tidak ada pola apa pun yang bisa menaklukkan hitungan mesin.',
  },
] as const;

export function stripQuizAnswers(
  questions: readonly QuizQuestion[]
): PublicQuizQuestion[] {
  return questions.map(({ correctOptionKey: _c, explanation: _e, ...pub }) => pub);
}

export function getContentVersion(): string {
  return CONTENT_VERSION;
}
