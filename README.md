# chatvexion2

Buatkan saya website chatbot AI full stack bernama "Vexion AI", dark theme (navy gelap ke hitam), mobile-first responsive. Gunakan Supabase sebagai backend (Auth + Database + Edge Functions).

Logo/Branding:

Icon gradient biru berbentuk diamond/kincir 4 kelopak dengan ruang negatif membentuk siluet bubble chat, di atas background rounded-square navy gelap dengan border putih tipis. Gunakan di favicon, splash screen, sidebar header, dan empty state chat.

Alur aplikasi: Landing → Login Google (Supabase Auth) → Mode Chat

1. Halaman Landing

Splash screen: logo Vexion AI, background gradient navy ke hitam

Nama "Vexion AI" + tagline singkat

Tombol "Mulai" → ke halaman login

2. Autentikasi

Supabase Auth dengan Google OAuth

Setelah login, simpan data ke tabel profiles (id, full_name, email, avatar_url)

Redirect ke halaman chat

3. Sidebar

Header: logo + "Vexion AI", tombol close

Menu: "Percakapan baru" (icon plus), "Telusuri percakapan" (icon search)

Section "Terbaru": list riwayat chat dari database, tiap item ada tombol hapus (icon trash)

Footer: avatar + nama + email user, icon settings, icon logout

(Tidak ada menu Gambar, Koleksi, atau Notebook baru)

4. Halaman Chat

Header: hamburger menu (kiri), tombol new chat (kanan) — tanpa dropdown pilihan model

Empty state: logo Vexion AI dengan efek glow, sapaan dinamis "Halo [Nama], ada yang bisa dibantu?", subtext "Tanya apa saja — semua percakapan otomatis tersimpan di akunmu."

Input bar: icon attach (upload file, max 5 file sekaligus, preview thumbnail dengan tombol hapus per file), placeholder "Tanya Vexion AI", icon mic, tombol kirim bulat biru

Animasi: fade-in tiap pesan baru, pulsing glow pada logo saat AI sedang memproses respons, loading indicator (animated dots/soundwave)

5. Halaman Settings — Konfigurasi API Key

Toggle mode: "API Key Vexion (Default)" vs "API Key Sendiri (Custom)", dengan transisi smooth

Mode Default:

Progress bar kuota harian: "X/20 pesan tersisa", "X/5 file tersisa hari ini"

Reset otomatis tiap hari

Mode Custom:

Input "API Key Utama" (Gemini)

Section "Backup API Keys" — tambah hingga 5 key cadangan (total maks 6 key)

Rotasi otomatis ke key berikutnya kalau key aktif kena limit/quota habis

Card video tutorial YouTube "Cara membuat Gemini API Key" (embed + thumbnail + tombol play) plus panduan singkat langkah-langkahnya

Desain card: rounded besar, subtle gradient border biru, micro-animation saat hover/toggle

untuk apikeys bawaan vexion gunakan 50 api keys gemini ini tolong pasang di secret tetapi walaupun di simpan di secret bisa di deploy ke vercel:AQ.Ab8RN6KJWxRAMSPrhMlcS94JC1ZrszeOFuAeuW93krudNk8HkQ

AQ.Ab8RN6L6rZ3BUHGDESc6bwjjiKe55ZOTQ0Obb_friLcT4kFWvQ

AQ.Ab8RN6I5VRB2jAzwyVxlS9BvlA1V0Z3Md6XPxKR9j1A_3M-CFQ

AQ.Ab8RN6JVgdTseyfhOyibQM7u020OYhCSvEvBf1lMTI1xHZT0bg

AQ.Ab8RN6KGaq--IZt9AuFfcs04Jj3TtntzmMuLVacuweI-1Ywb5Q

AQ.Ab8RN6J--kob-mWqh2ghAijmVZhcoxbbL50hztLv04kuiS3Yjw

AQ.Ab8RN6JMo5rfLvX0oo1Zg1CkShjyvgRQNwiTAyLubJIJUNoG9w

AQ.Ab8RN6IQgo1Ds-N2GIS49buszaRcpo_dCX1H7KMkR3hbEPOpHA

AQ.Ab8RN6J0T4mxMk6BCB0JsccMpAKOlHcMqBDVoRr0p0danPhehw

AQ.Ab8RN6Jzlt3vsBpUZPi5tDfEaTlFE1GzSfezS8C14sZyhxraRQ

AQ.Ab8RN6KfJhfRb5HIjxuLLctNmqcCDl5TniSg5xBRDOCuTo0AWg

AQ.Ab8RN6JObeOqfYeW1366bg07LCsdpt2ycJqWdUJ76KTJt7zLjw

AQ.Ab8RN6JcekSuAbmDM9ek0tYGuhIdjAxtlwZMyHPq2AMXFiHMrA

AQ.Ab8RN6JfWG9uI4Ky2N4XCbsH6f3GobcoLuWnN-ShJRT4y1vhvQ

AQ.Ab8RN6L3J-K7PgFRua5OFVVsrszvX_Bv6egR-qiBgfPA6EGMRg

AQ.Ab8RN6K0WVYY38d1o8d9eFaDrDvvdzpBiKWX-t_kD_0pQRkVAw

AQ.Ab8RN6LW679y32KNh-F2pTlVsqetk4ueuBCOiR4iJ-QkABP_qQ

AQ.Ab8RN6IYuRYkPwJ7-o_Q206ZO0G0JJeK1bjHec31QO-Iettq0A

AQ.Ab8RN6I0J8IfUU2-fXPMJZNi0FmAO3e-4FA8KFwk4KTa7BFcSQ

AQ.Ab8RN6JWX6vuqDbX9FfePG4tfx6iWYXy1g1zwl6_7DPHMvZJ2w

AQ.Ab8RN6KXNM18Mg1dbHFsSywUcAu9qgsiid0Mz1VmNOFsJGmB_A

AQ.Ab8RN6Ih3pjM59-lvMsnABvjFyQcMmiSDxB4WWYsPQg2v6ityw

AQ.Ab8RN6ISr-3R5d5QivKQEQkqqP-iBSjVo90IKV5Nmm1AR-cKLg

AQ.Ab8RN6LCFMjdrJKKFbPvprHmDwkRA2ZRvv-06h8W9Wui2CGzzw

AQ.Ab8RN6L2AGgu_t52Ot4qu3izXaA4p1NcC3LviC4e5Or4t1OX8Q

AQ.Ab8RN6JThgL4szXDKcMv8OJrNliTLzL7rNb1ho7qEQHMDuSuCQ

AQ.Ab8RN6I9ld3x6ntl-1Jc8GqDotP1T1PQmzOSgnByozj55B52pg

AQ.Ab8RN6L0zdABaUu4pgIf5xlDaNwe-f2YEMAqTMjpGpM5j9t7eA

AQ.Ab8RN6LXVSe_xWDSxegc9C16PZ3r-9h_cCJqHxhTADyRN67y-w

AQ.Ab8RN6JfDhvVieBejSApq4fppkHFzkSmYIZCIQrBlfeEuSNa3A

AQ.Ab8RN6K-V9mjOPO5qJHeGAPcu7NzWUpHhHUukJa0ShFlV6ztjA

AQ.Ab8RN6JL2crjwlE9mD7Z4_YjS0HG4EfGBFc0-BIHBiMAnM6Tdg

AQ.Ab8RN6IvtwXDAjrmlhv7rF77HMkk5VClh5X1XGCw1UD05UdF0A

AQ.Ab8RN6Km913gxFjNDAsg-SDlT_JRq3iEgwDtKyB10_uduZjM_w

AQ.Ab8RN6KPm25XR7smjmbvsPsLGEMIhHYCfcjxehilxn8Xq8aljQ

AQ.Ab8RN6I2bjZeDGVoCzPGsvk-jVv42J9F0DIAQrS869N4LvD7Wg

AQ.Ab8RN6Lfn9O7NzqMlY_fE6Pakiwbk0aukd7uBQ6vAWIT67H7mA

AQ.Ab8RN6LTjmkEAjnT5Sgd4IQMAcv4_aoQz9RcRpQEj5yAshnbdg

AQ.Ab8RN6I2bjZeDGVoCzPGsvk-jVv42J9F0DIAQrS869N4LvD7Wg

AQ.Ab8RN6Lfn9O7NzqMlY_fE6Pakiwbk0aukd7uBQ6vAWIT67H7mA

AQ.Ab8RN6LTjmkEAjnT5Sgd4IQMAcv4_aoQz9RcRpQEj5yAshnbdg

AQ.Ab8RN6L00NWawYuwNImgdqrom4xFE1EXUEN375VMLdOIHrEx9g

AQ.Ab8RN6Jm-grNtfxlTfqDvjqT1GJByQSVw2YkI6liQMwgU0_1ug

AQ.Ab8RN6LlmVEpobwv2Lpnrx4fNnvery8xtIkvqro8MdQHpDiW-A

AQ.Ab8RN6IgrivllJFNZJRtMliFNxjgarL8yr0RL27IJHdCnhMeug

AQ.Ab8RN6I8QVFQVtl-b-TteEtAdm32XMcGD_4aWDZiFi3b_-Wyxg

AQ.Ab8RN6KE3Ns159DsoKYqYb9gcJutMMSk1blKaGH1Pr0oFAtAuw

AQ.Ab8RN6JSm6VT5WOOchE-iISh2D1okK-Mf5rcmhoVpgr6Omo3CA

AQ.Ab8RN6Lfa5XGCDcJcqoeYK97eisyGR8L3nKmB4npvqbwivkw8Q

AQ.Ab8RN6JSMBbJoD7EtVuIpQT91Qra7Ak-RI03jxBjOu4BtJxWDA

dan untuk loginnya pake client id:191990376879- o6lulhlp9jvcuson9d710gqlmgh1d7qp.a pps.googleusercontent.com

dan client secret gunakan ini:GOCSPX- t1ElkYobN5rwJUU5zcHoC9a8GrvQ

buat semua simpan di secret key nya tetapi dapat bisa di akses saat deploy ke vercel

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://chatvexion2.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7b25d0a3-5f10-4c4a-867c-58d924839d20).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
