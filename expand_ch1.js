const pool = require('./server/db/pool');

// 50 scenes: all player_male emotes, no terminal, lots of choice + investigate + email + lesson
async function expandChapter1() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM vn_scene_choices WHERE scene_id IN (SELECT id FROM vn_scenes WHERE chapter_id = 1)');
        await client.query('DELETE FROM vn_scenes WHERE chapter_id = 1');
        console.log('Old scenes cleared.');

        const scenes = [
// --- ACT 1: HARI PERTAMA ---
{ id:1,  type:'dialogue', bg:'office',  char:'player_male', expr:'happy',   spk:'{{playerName}}', txt:'Akhirnya! Hari pertama di Akebono Brake Indonesia. Tempatnya lebih keren dari yang kubayangkan.', next:2 },
{ id:2,  type:'dialogue', bg:'office',  char:'akebot',      expr:'happy',   spk:'Akebot',          txt:'Selamat datang, Rekrut {{playerName}}! Saya Akebot, asisten keamanan siber Anda. Siap memulai orientasi?', next:3 },
{ id:3,  type:'dialogue', bg:'office',  char:'player_male', expr:'normal',  spk:'{{playerName}}', txt:'Tentu! Saya sudah belajar banyak tentang keamanan siber sebelum masuk sini.', next:4 },
{ id:4,  type:'choice',   bg:'office',  char:'player_male', expr:'normal',  spk:'Akebot',          txt:'Akebot: Baik, tes cepat dulu. Apa itu phishing?',
  choices:[
    {text:'Serangan siber yang mencuri data lewat penipuan identitas.',correct:true, xp:50, next:5, csq:'Tepat sekali!', les:'Phishing adalah upaya penipuan untuk mencuri kredensial dengan menyamar sebagai entitas tepercaya.'},
    {text:'Virus yang merusak file di komputer.',                       correct:false,xp:0,  next:5, csq:'Kurang tepat. Itu lebih ke malware.',les:'Phishing beda dengan virus/malware. Phishing berfokus pada penipuan sosial.'},
    {text:'Saya tidak tahu.',                                           correct:false,xp:0,  next:5, csq:'Tidak masalah, kita akan belajar!',les:'Phishing adalah teknik penipuan untuk mencuri data via email/pesan palsu.'},
  ]},
{ id:5,  type:'dialogue', bg:'office',  char:'akebot',      expr:'happy',   spk:'Akebot',          txt:'Bagus! Sekarang mari kita ke meja kerja Anda. Ada email yang perlu Anda periksa.', next:6 },
{ id:6,  type:'dialogue', bg:'desk',    char:'player_male', expr:'normal',  spk:'{{playerName}}', txt:'Email dari siapa? Baru hari pertama sudah ada tugas?', next:7 },
{ id:7,  type:'dialogue', bg:'desk',    char:'akebot',      expr:'worried', spk:'Akebot',          txt:'Dari "CEO Akebono". Tapi ada yang janggal... perhatikan baik-baik.', next:8 },
{ id:8,  type:'email',    bg:'desk',
  custom_data:{ email:{
    from:'ceo.akebono-id@mailer-corp.net', to:'{{playerName}}@akebono-brake.co.id',
    subject:'RAHASIA: Transfer Dana Segera',
    body:'Halo {{playerName}},\n\nSaya perlu Anda memproses pembayaran mendesak Rp 500.000.000 ke rekening vendor baru kami. Ini sangat rahasia — jangan beritahu siapa pun termasuk manajer Anda. Konfirmasi segera.\n\nTerima kasih,\nDirektur Utama',
    redFlags:['Domain email asing (mailer-corp.net bukan akebono-brake.co.id)','Permintaan kerahasiaan yang mencurigakan','Jumlah transfer yang sangat besar','Urgensi buatan tanpa verifikasi resmi']
  }},
  next:9 },
{ id:9,  type:'dialogue', bg:'desk',    char:'player_male', expr:'shocked', spk:'{{playerName}}', txt:'Rp 500 juta?! Dan diminta dirahasiakan dari manajer? Ini sangat tidak normal.', next:10 },
{ id:10, type:'investigate', bg:'desk',
  custom_data:{ uiType:'email',
    targets:[
      {id:'t1',x:18,y:10,w:55,h:8, label:'Domain Email Palsu'},
      {id:'t2',x:10,y:42,w:75,h:12,label:'Instruksi Kerahasiaan'},
      {id:'t3',x:10,y:60,w:60,h:10,label:'Permintaan Transfer Besar'},
    ]},
  successNext:11, failNext:12, timer:30 },
{ id:11, type:'dialogue', bg:'desk', char:'player_male', expr:'proud',   spk:'{{playerName}}', txt:'Ketemu semua red flag-nya! Ini jelas Business Email Compromise.', next:13 },
{ id:12, type:'dialogue', bg:'desk', char:'player_male', expr:'sad',     spk:'{{playerName}}', txt:'Hmm, aku tidak berhasil menemukan semua tandanya. Akebot, bantu jelaskan.', next:13 },
{ id:13, type:'lesson', bg:'office',
  custom_data:{ title:'Business Email Compromise (BEC)',
    points:['BEC memalsukan identitas eksekutif senior untuk tipu karyawan.',
            'Ciri khas: domain email mirip tapi berbeda, bahasa mendesak, kerahasiaan paksa.',
            'Selalu verifikasi lewat telepon langsung jika menerima permintaan keuangan besar.']},
  next:14 },
{ id:14, type:'choice', bg:'desk', char:'player_male', expr:'worried', spk:'{{playerName}}', txt:'Apa yang sebaiknya saya lakukan dengan email ini sekarang?',
  choices:[
    {text:'Laporkan ke tim IT Security dan manajer saya.',correct:true, xp:100,next:15,csq:'Benar! Laporkan selalu.',les:'Melaporkan insiden keamanan dengan cepat mencegah korban lain.'},
    {text:'Balas email dan minta klarifikasi.',           correct:false,xp:0,  next:15,csq:'Berbahaya! Jangan balas.',les:'Membalas mengkonfirmasi akun aktif kepada penyerang.'},
    {text:'Hapus emailnya agar tidak ada masalah.',       correct:false,xp:0,  next:15,csq:'Salah! Hapus = hilangkan bukti.',les:'Email phishing adalah bukti. Jangan hapus, laporkan.'},
  ]},

// --- ACT 2: PASSWORD & AKSES TIDAK SAH ---
{ id:15, type:'dialogue', bg:'office', char:'player_male', expr:'happy',  spk:'{{playerName}}', txt:'Laporan sudah dikirim! Sekarang apa selanjutnya, Akebot?', next:16 },
{ id:16, type:'dialogue', bg:'office', char:'akebot',      expr:'normal', spk:'Akebot',          txt:'Bagus. Tapi ada masalah lain. Sistem mendeteksi ada yang mencoba login ke akun Anda berkali-kali.', next:17 },
{ id:17, type:'dialogue', bg:'desk',   char:'player_male', expr:'shocked',spk:'{{playerName}}', txt:'Apa?! Akun saya diserang?? Padahal baru hari pertama!', next:18 },
{ id:18, type:'choice', bg:'desk', char:'player_male', expr:'worried', spk:'{{playerName}}', txt:'Kata sandi saya saat ini: "akebono123". Apakah ini sudah aman?',
  choices:[
    {text:'Tidak aman. Harus segera diganti dengan kata sandi kuat.',correct:true, xp:75, next:19,csq:'Tepat! Kata sandi mudah ditebak.',les:'Password harus minimal 12 karakter, kombinasi huruf besar, angka, simbol.'},
    {text:'Aman, ada nama perusahaan di dalamnya.',                  correct:false,xp:0,  next:19,csq:'Salah! Nama perusahaan mudah ditebak.',les:'Gunakan passphrase atau password manager untuk password yang kuat.'},
    {text:'Biasa saja, nanti saja diganti.',                         correct:false,xp:0,  next:19,csq:'Berbahaya! Jangan tunda ganti password.',les:'Setiap detik terlambat = celah keamanan terbuka.'},
  ]},
{ id:19, type:'dialogue', bg:'desk', char:'player_male', expr:'normal', spk:'{{playerName}}', txt:'Oke saya ganti sekarang. Tapi bagaimana caranya buat password yang kuat?', next:20 },
{ id:20, type:'lesson', bg:'office',
  custom_data:{ title:'Membuat Kata Sandi yang Kuat',
    points:['Gunakan minimal 12 karakter dengan kombinasi huruf besar, kecil, angka, dan simbol.',
            'Hindari kata-kata umum seperti nama, tanggal lahir, atau nama perusahaan.',
            'Gunakan password manager untuk menyimpan dan membuat password unik per akun.',
            'Aktifkan Multi-Factor Authentication (MFA) jika tersedia.']},
  next:21 },
{ id:21, type:'choice', bg:'desk', char:'player_male', expr:'normal', spk:'Akebot', txt:'Akebot: Mana contoh password yang PALING kuat?',
  choices:[
    {text:'"K3amanan@Akebono!2024"',             correct:true, xp:50,next:22,csq:'Benar! Kompleks dan panjang.',les:'Kombinasi karakter beragam = password kuat.'},
    {text:'"password123"',                        correct:false,xp:0, next:22,csq:'Ini password terlemah di dunia!',les:'Jangan pernah gunakan "password" atau variasinya.'},
    {text:'"AkebonoAdmin"',                       correct:false,xp:0, next:22,csq:'Terlalu predictable.',les:'Jangan gunakan nama institusi sebagai password.'},
  ]},

// --- ACT 3: PHISHING LINK ---
{ id:22, type:'dialogue', bg:'desk',  char:'player_male', expr:'happy',  spk:'{{playerName}}', txt:'Password sudah diperbarui! Dapat notifikasi SMS konfirmasi juga. Aman sekarang.', next:23 },
{ id:23, type:'dialogue', bg:'desk',  char:'manager',     expr:'normal', spk:'Manager',         txt:'{{playerName}}, cek group chat departemen. Ada informasi update sistem dari IT.', next:24 },
{ id:24, type:'dialogue', bg:'desk',  char:'player_male', expr:'normal', spk:'{{playerName}}', txt:'Baik, Pak. Saya cek sekarang.', next:25 },
{ id:25, type:'dialogue', bg:'desk',  char:'player_male', expr:'shocked',spk:'{{playerName}}', txt:'Ada link: "http://akebono-internal-update.site/login" — diminta login ulang untuk update sistem.', next:26 },
{ id:26, type:'choice', bg:'desk', char:'player_male', expr:'worried', spk:'{{playerName}}', txt:'Apakah saya harus klik link tersebut dan login?',
  choices:[
    {text:'Tidak! Domain tidak resmi, ini phishing link.',    correct:true, xp:100,next:27,csq:'Hebat! Waspada terhadap domain palsu.',les:'Domain resmi Akebono adalah akebono-brake.co.id, bukan .site atau domain lain.'},
    {text:'Ya, karena diminta manager di grup resmi.',        correct:false,xp:0,  next:27,csq:'Salah! Grup chat bisa disusupi.',les:'Verifikasi link selalu, walau dikirim dari sumber yang terlihat terpercaya.'},
    {text:'Klik saja, nanti kalau ada masalah baru lapor.',  correct:false,xp:0,  next:27,csq:'Sangat berbahaya!',les:'Satu klik di link phishing bisa mengekspos seluruh jaringan perusahaan.'},
  ]},
{ id:27, type:'dialogue', bg:'desk', char:'player_male', expr:'proud', spk:'{{playerName}}', txt:'Saya tidak akan klik. Saya laporkan dulu ke IT Security untuk verifikasi domain ini.', next:28 },
{ id:28, type:'dialogue', bg:'desk', char:'akebot',      expr:'proud', spk:'Akebot',          txt:'Keputusan yang tepat! Tim IT mengkonfirmasi itu adalah situs phishing. Anda baru saja mencegah serangan besar.', next:29 },
{ id:29, type:'lesson', bg:'office',
  custom_data:{ title:'Cara Mengenali Link Phishing',
    points:['Periksa domain dengan teliti — satu huruf berbeda bisa berbeda situs.',
            'Hover mouse di atas link sebelum klik untuk melihat URL aslinya.',
            'Gunakan tool seperti VirusTotal untuk scan link mencurigakan.',
            'Situs resmi perusahaan biasanya menggunakan domain yang sudah dikenal.']},
  next:30 },

// --- ACT 4: INSIDEN DI RUANG SERVER ---
{ id:30, type:'dialogue', bg:'server', char:'player_male', expr:'worried', spk:'{{playerName}}', txt:'Akebot, alarm apa ini?! Ada notifikasi mengerikan muncul di semua layar!', next:31 },
{ id:31, type:'dialogue', bg:'server', char:'akebot',      expr:'worried', spk:'Akebot',          txt:'Ada upaya akses tidak sah ke server database utama! Kita harus bertindak cepat!', next:32 },
{ id:32, type:'choice', bg:'server', char:'player_male', expr:'shocked', spk:'{{playerName}}', txt:'Langkah pertama yang harus dilakukan ketika terjadi insiden keamanan adalah...',
  choices:[
    {text:'Isolasi sistem yang terinfeksi dari jaringan.',        correct:true, xp:100,next:33,csq:'Benar! Isolasi cegah penyebaran.',les:'Langkah pertama insiden response: containment — isolasi sistem yang terdampak.'},
    {text:'Matikan semua komputer di kantor sekarang.',          correct:false,xp:0,  next:33,csq:'Terlalu ekstrem dan ganggu operasi.',les:'Matikan semua sistem = downtime total. Isolasi hanya yang terdampak.'},
    {text:'Tunggu IT pusat datang dulu baru ambil tindakan.',   correct:false,xp:0,  next:33,csq:'Terlambat! Penyerang sudah lebih jauh.',les:'Insiden siber: setiap menit kritis. Tindak segera sesuai prosedur.'},
  ]},
{ id:33, type:'dialogue', bg:'server', char:'player_male', expr:'normal', spk:'{{playerName}}', txt:'Server B sudah saya isolasi dari jaringan. Sekarang saya hubungi tim respons insiden.', next:34 },
{ id:34, type:'dialogue', bg:'server', char:'akebot',      expr:'happy',  spk:'Akebot',          txt:'Sempurna! Tim segera dalam perjalanan. Sementara itu, kita perlu tahu asal serangan.', next:35 },
{ id:35, type:'investigate', bg:'server',
  custom_data:{ uiType:'browser',
    targets:[
      {id:'s1',x:5, y:15,w:40,h:10,label:'Log IP Mencurigakan'},
      {id:'s2',x:5, y:40,w:60,h:10,label:'Timestamp Akses Tidak Normal'},
      {id:'s3',x:50,y:65,w:40,h:10,label:'File yang Dimodifikasi'},
    ]},
  successNext:36, failNext:37, timer:30 },
{ id:36, type:'dialogue', bg:'server', char:'player_male', expr:'proud',   spk:'{{playerName}}', txt:'Ditemukan! IP asing dari luar negeri mengakses jam 3 pagi dan mengubah file konfigurasi.', next:38 },
{ id:37, type:'dialogue', bg:'server', char:'player_male', expr:'sad',     spk:'{{playerName}}', txt:'Aduh, saya tidak berhasil memetakan serangan dengan lengkap. Semoga tidak ada data yang bocor.', next:38 },
{ id:38, type:'choice', bg:'server', char:'player_male', expr:'normal', spk:'Akebot', txt:'Akebot: Setelah insiden ditangani, apa yang WAJIB dilakukan?',
  choices:[
    {text:'Dokumentasikan seluruh kejadian dan buat laporan insiden resmi.',correct:true, xp:75,next:39,csq:'Tepat! Dokumentasi adalah kunci.',les:'Laporan insiden membantu mencegah kejadian serupa dan menjadi bahan audit.'},
    {text:'Lupakan saja, yang penting sudah ditangani.',                   correct:false,xp:0, next:39,csq:'Salah! Tanpa dokumentasi, kita tidak bisa belajar.',les:'Setiap insiden harus didokumentasikan untuk perbaikan sistem ke depan.'},
    {text:'Umumkan ke semua karyawan detail serangan tersebut.',           correct:false,xp:0, next:39,csq:'Hati-hati! Informasi teknis sensitif jangan disebarkan sembarangan.',les:'Informasi insiden dibagikan perlu-tahu saja sesuai protokol.'},
  ]},

// --- ACT 5: SOCIAL ENGINEERING ---
{ id:39, type:'dialogue', bg:'elevator', char:'player_male', expr:'normal', spk:'{{playerName}}', txt:'Istirahat sebentar. Naik lift ke kantin... ada yang tidak kukenal mengikutiku masuk.', next:40 },
{ id:40, type:'dialogue', bg:'elevator', char:'villain',     expr:'normal', spk:'Orang Asing',    txt:'Hai! Kamu karyawan baru ya? Saya konsultan eksternal. Bisa pinjam kartu akses sebentar? Kartu saya ketinggalan.', next:41 },
{ id:41, type:'dialogue', bg:'elevator', char:'player_male', expr:'worried', spk:'{{playerName}}', txt:'Hmm... orang ini tidak pakai tanda pengenal resmi. Tapi kelihatannya tidak berbahaya...', next:42 },
{ id:42, type:'choice', bg:'elevator', char:'player_male', expr:'worried', spk:'{{playerName}}', txt:'Apa yang sebaiknya saya lakukan?',
  choices:[
    {text:'Tolak dengan sopan dan minta dia hubungi resepsionis.',correct:true, xp:100,next:43,csq:'Tepat! Prosedur keamanan fisik harus ditegakkan.',les:'Tailgating adalah ancaman fisik nyata. Selalu verifikasi identitas tamu.'},
    {text:'Pinjamkan saja, toh cuma sebentar.',                   correct:false,xp:0,  next:43,csq:'Berbahaya! Ini bisa jadi social engineering.',les:'Satu akses tidak sah bisa buka seluruh gedung untuk penyerang.'},
    {text:'Diam saja dan pura-pura tidak dengar.',               correct:false,xp:0,  next:43,csq:'Kurang tepat. Lebih baik tegur dengan sopan.',les:'Diam bisa diartikan setuju. Ambil tindakan aktif sesuai prosedur.'},
  ]},
{ id:43, type:'dialogue', bg:'elevator', char:'villain',     expr:'normal', spk:'Orang Asing',    txt:'Oh maaf ya, saya memang harusnya lewat prosedur resmi. Terima kasih sudah mengingatkan.', next:44 },
{ id:44, type:'dialogue', bg:'elevator', char:'player_male', expr:'proud', spk:'{{playerName}}', txt:'Lega. Keamanan fisik sama pentingnya dengan keamanan digital!', next:45 },
{ id:45, type:'lesson', bg:'office',
  custom_data:{ title:'Social Engineering & Keamanan Fisik',
    points:['Social engineering memanipulasi manusia, bukan sistem teknis.',
            'Tailgating = masuk area terlarang mengikuti orang yang berwenang.',
            'Selalu verifikasi identitas tamu lewat resepsionis atau security.',
            'Jangan pernah meminjamkan kartu akses atau badge kepada siapapun.']},
  next:46 },

// --- ACT 6: PENUTUP & REFLEKSI ---
{ id:46, type:'dialogue', bg:'office', char:'akebot',      expr:'happy',  spk:'Akebot',          txt:'{{playerName}}, Anda telah melewati hari pertama yang luar biasa penuh tantangan nyata!', next:47 },
{ id:47, type:'dialogue', bg:'office', char:'player_male', expr:'happy',  spk:'{{playerName}}', txt:'Tidak menyangka hari pertama langsung diuji seperti ini. Saya banyak belajar hari ini!', next:48 },
{ id:48, type:'choice', bg:'office', char:'player_male', expr:'normal', spk:'Akebot', txt:'Akebot: Terakhir — apa prinsip utama keamanan siber yang kamu pelajari hari ini?',
  choices:[
    {text:'"Verifikasi dulu sebelum bertindak — baik digital maupun fisik."',correct:true, xp:150,next:49,csq:'Sempurna! Itulah inti dari semua yang terjadi hari ini.',les:'Verifikasi adalah langkah pertama dan terpenting dalam keamanan siber.'},
    {text:'"Percayai semua email dari domain yang terlihat resmi."',         correct:false,xp:0,  next:49,csq:'Justru sebaliknya! Domain pun bisa dipalsukan.',les:'Phishing modern sangat canggih. Jangan percaya tampilan luar saja.'},
    {text:'"IT Security adalah urusan tim IT, bukan saya."',                correct:false,xp:0,  next:49,csq:'Salah besar! Keamanan siber adalah tanggung jawab semua orang.',les:'Setiap karyawan adalah garis pertahanan pertama perusahaan.'},
  ]},
{ id:49, type:'dialogue', bg:'office', char:'player_male', expr:'happy',  spk:'{{playerName}}', txt:'Saya siap untuk tantangan berikutnya. Akebono Brake Indonesia akan saya jaga!', next:50 },
{ id:50, type:'ending', bg:'office', ending_type:'good',
  ending_title:'🛡️ Rekrut Terbaik Hari Ini!',
  ending_message:'Anda berhasil melewati seluruh tantangan hari pertama dengan cemerlang. Deteksi BEC, kenali phishing link, tangani insiden server, dan hadapi social engineering — semuanya dilakukan dengan sigap!',
  xp_bonus:600,
  lesson_recap:[
    'BEC menggunakan identitas palsu eksekutif untuk penipuan finansial',
    'Password kuat = minimal 12 karakter + MFA',
    'Selalu verifikasi link sebelum klik, walau dari sumber terpercaya',
    'Langkah pertama insiden: isolasi, bukan panik',
    'Social engineering menyerang manusia, bukan sistem',
    'Keamanan siber adalah tanggung jawab setiap individu'
  ]
},
        ]; // end scenes

        // Insert all scenes
        for (const s of scenes) {
            const cdata = s.custom_data || {};
            const res = await client.query(
                `INSERT INTO vn_scenes
                (chapter_id, scene_type, background, char_left, char_left_expr, speaker_name, dialogue_text, xp_reward, custom_data, next_scene_id, scene_order, ending_type, ending_title, ending_message, xp_bonus, lesson_recap, scene_key, scene_name, timer)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
                RETURNING id`,
                [
                    1, s.type, s.bg || 'office',
                    s.char || null, s.expr || 'normal',
                    s.spk || '', s.txt || '',
                    s.xp_reward || 0,
                    JSON.stringify(cdata),
                    null, s.id,
                    s.ending_type || null, s.ending_title || null, s.ending_message || null,
                    s.xp_bonus || 0,
                    JSON.stringify(s.lesson_recap || null),
                    `ch1_s${s.id}`, `Scene ${s.id}`,
                    s.timer || null
                ]
            );
            s.db_id = res.rows[0].id;
        }
        console.log('All 50 scenes inserted.');

        // Second pass: wire up next_scene_id, successNext, failNext
        for (const s of scenes) {
            if (s.next) {
                const t = scenes.find(x => x.id === s.next);
                if (t) await client.query('UPDATE vn_scenes SET next_scene_id=$1 WHERE id=$2', [t.db_id, s.db_id]);
            }
            if (s.successNext) {
                const t = scenes.find(x => x.id === s.successNext);
                if (t) await client.query("UPDATE vn_scenes SET custom_data = custom_data || JSONB_BUILD_OBJECT('successNext',$1::int) WHERE id=$2", [t.db_id, s.db_id]);
            }
            if (s.failNext) {
                const t = scenes.find(x => x.id === s.failNext);
                if (t) await client.query("UPDATE vn_scenes SET custom_data = custom_data || JSONB_BUILD_OBJECT('failNext',$1::int) WHERE id=$2", [t.db_id, s.db_id]);
            }
            // Insert choices
            if (s.choices) {
                for (const c of s.choices) {
                    const t = scenes.find(x => x.id === c.next);
                    await client.query(
                        `INSERT INTO vn_scene_choices (scene_id, choice_text, is_correct, xp_reward, consequence_text, lesson_text, next_scene_id)
                        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                        [s.db_id, c.text, c.correct, c.xp, c.csq, c.les, t ? t.db_id : null]
                    );
                }
            }
        }

        await client.query('COMMIT');
        console.log('✅ Chapter 1 — 50 scenes committed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', err.message, err.detail || '');
    } finally {
        client.release();
        process.exit(0);
    }
}

expandChapter1();
