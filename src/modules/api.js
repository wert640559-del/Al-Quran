/**
 * QuranAPI - Handler untuk semua API calls ke EQuran.id
 */
export class QuranAPI {
    constructor() {
        this.baseURL = 'https://equran.id/api/v2';
        this.audioBaseURL = 'https://equran.id/api/v2';
        
        // Qari mapping untuk audio
        this.qariMapping = {
            'abdullah_al_juhany': '01',
            'abdul_muhsin_al_qasim': '02', 
            'abdurrahman_as_sudais': '03',
            'ibrahim_al_dossari': '04',
            'misyari_rasyid_al_afasy': '05'
        };
    }

    /**
     * Generic fetch wrapper dengan error handling
     */
    async fetchAPI(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.code !== 200) {
                throw new Error(data.message || 'API Error');
            }

            return data.data;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw new Error(`Gagal mengambil data: ${error.message}`);
        }
    }

    /**
     * GET /api/v2/surat - Mendapatkan daftar semua surat
     * @returns {Promise<Array>} Array of surat objects
     */
    async getSuratList() {
        try {
            const data = await this.fetchAPI('/surat');
            return data.map(surat => ({
                nomor: surat.nomor,
                nama: surat.nama,
                namaLatin: surat.namaLatin,
                jumlahAyat: surat.jumlahAyat,
                tempatTurun: surat.tempatTurun,
                arti: surat.arti,
                deskripsi: surat.deskripsi,
                audioFull: surat.audioFull
            }));
        } catch (error) {
            throw new Error('Gagal memuat daftar surat Al-Qur\'an');
        }
    }

    /**
     * GET /api/v2/surat/{id} - Mendapatkan detail surat dengan ayat
     * @param {string|number} suratId - ID surat (1-114)
     * @returns {Promise<Object>} Detail surat dengan ayat
     */
    async getSuratDetail(suratId) {
        try {
            if (!suratId || suratId < 1 || suratId > 114) {
                throw new Error('ID surat tidak valid');
            }

            const data = await this.fetchAPI(`/surat/${suratId}`);
            
            return {
                nomor: data.nomor,
                nama: data.nama,
                namaLatin: data.namaLatin,
                jumlahAyat: data.jumlahAyat,
                tempatTurun: data.tempatTurun,
                arti: data.arti,
                deskripsi: data.deskripsi,
                audioFull: data.audioFull,
                ayat: data.ayat.map(ayat => ({
                    nomorAyat: ayat.nomorAyat,
                    teksArab: ayat.teksArab,
                    teksLatin: ayat.teksLatin,
                    teksIndonesia: ayat.teksIndonesia,
                    audio: ayat.audio
                }))
            };
        } catch (error) {
            throw new Error(`Gagal memuat detail surat: ${error.message}`);
        }
    }

    /**
     * GET /api/v2/tafsir/{id} - Mendapatkan tafsir surat
     * @param {string|number} suratId - ID surat (1-114)  
     * @returns {Promise<Object>} Tafsir surat
     */
    async getTafsir(suratId) {
        try {
            if (!suratId || suratId < 1 || suratId > 114) {
                throw new Error('ID surat tidak valid');
            }

            const data = await this.fetchAPI(`/tafsir/${suratId}`);
            
            return {
                nomor: data.nomor,
                nama: data.nama,
                namaLatin: data.namaLatin,
                jumlahAyat: data.jumlahAyat,
                tempatTurun: data.tempatTurun,
                arti: data.arti,
                deskripsi: data.deskripsi,
                tafsir: data.tafsir.map(tafsir => ({
                    ayat: tafsir.ayat,
                    teks: tafsir.teks
                }))
            };
        } catch (error) {
            throw new Error(`Gagal memuat tafsir: ${error.message}`);
        }
    }

    /**
 * Mendapatkan URL audio per ayat dari data surat
 * @param {Object} suratData - Data surat dari getSuratDetail
 * @param {number} ayatNumber - Nomor ayat
 * @param {string} qariKey - Key qari dari qariMapping
 * @returns {string} URL audio mp3
 */
getAudioUrl(suratData, ayatNumber, qariKey) {
    if (!suratData || !suratData.ayat) {
        throw new Error('Data surat tidak valid');
    }

    const qariId = this.qariMapping[qariKey.toLowerCase()];
    if (!qariId) throw new Error('Qari tidak valid');

    const ayatIndex = ayatNumber - 1; // array mulai dari 0
    if (!suratData.ayat[ayatIndex]) {
        throw new Error('Ayat tidak ditemukan');
    }

    return suratData.ayat[ayatIndex].audio[qariId];
}

/**
 * Mendapatkan URL audio untuk ayat tertentu dengan qari pilihan
 * @param {string|number} suratId - ID surat
 * @param {string|number} ayatNumber - Nomor ayat
 * @param {string} qariKey - Key qari dari qariMapping
 * @returns {string} URL audio
 */
getAudioUrl(suratId, ayatNumber, qariKey) {
    if (!this.qariMapping[qariKey]) {
        throw new Error('Qari tidak valid');
    }

    const qariId = this.qariMapping[qariKey];
    
    // Gunakan URL langsung dari data API, jangan konstruksi manual
    // Contoh: "https://cdn.equran.id/audio-partial/Abdullah-Al-Juhany/114001.mp3"
    const suratPadded = String(suratId).padStart(3, '0');
    const ayatPadded = String(ayatNumber).padStart(3, '0');
    
    // Format: https://cdn.equran.id/audio-partial/{QariName}/{surat3digit}{ayat3digit}.mp3
    const qariNames = {
        'abdullah_al_juhany': 'Abdullah-Al-Juhany',
        'abdul_muhsin_al_qasim': 'Abdul-Muhsin-Al-Qasim',
        'abdurrahman_as_sudais': 'Abdurrahman-as-Sudais',
        'ibrahim_al_dossari': 'Ibrahim-Al-Dossari',
        'misyari_rasyid_al_afasy': 'Misyari-Rasyid-Al-Afasi'
    };
    
    const qariName = qariNames[qariKey];
    return `https://cdn.equran.id/audio-partial/${qariName}/${suratPadded}${ayatPadded}.mp3`;
}

// Alternative: Method yang lebih reliable menggunakan data langsung dari API
async getAyatAudioUrl(suratId, ayatNumber, qariKey) {
    try {
        const suratDetail = await this.getSuratDetail(suratId);
        const ayat = suratDetail.ayat.find(a => a.nomorAyat == ayatNumber);
        
        if (!ayat || !ayat.audio) {
            throw new Error('Audio tidak tersedia untuk ayat ini');
        }
        
        const qariId = this.qariMapping[qariKey];
        return ayat.audio[qariId];
    } catch (error) {
        throw new Error(`Gagal mendapatkan URL audio: ${error.message}`);
    }
}


    /**
     * Search surat berdasarkan nama atau nomor
     * @param {string} query - Kata kunci pencarian
     * @returns {Promise<Array>} Hasil pencarian surat
     */
    async searchSurat(query) {
        try {
            const allSurat = await this.getSuratList();
            const searchTerm = query.toLowerCase();
            
            return allSurat.filter(surat => 
                surat.nama.toLowerCase().includes(searchTerm) ||
                surat.namaLatin.toLowerCase().includes(searchTerm) ||
                surat.arti.toLowerCase().includes(searchTerm) ||
                surat.nomor.toString().includes(searchTerm)
            );
        } catch (error) {
            throw new Error(`Gagal melakukan pencarian: ${error.message}`);
        }
    }

    /**
     * Search ayat dalam surat tertentu
     * @param {string|number} suratId - ID surat
     * @param {string} query - Kata kunci pencarian
     * @returns {Promise<Array>} Hasil pencarian ayat
     */
    async searchAyatInSurat(suratId, query) {
        try {
            const suratDetail = await this.getSuratDetail(suratId);
            const searchTerm = query.toLowerCase();
            
            return suratDetail.ayat.filter(ayat => 
                ayat.teksIndonesia.toLowerCase().includes(searchTerm) ||
                ayat.teksLatin.toLowerCase().includes(searchTerm) ||
                ayat.teksArab.includes(query) ||
                ayat.nomorAyat.toString().includes(query)
            );
        } catch (error) {
            throw new Error(`Gagal mencari ayat: ${error.message}`);
        }
    }

    /**
     * Get random ayat untuk quote harian
     * @returns {Promise<Object>} Random ayat
     */
    async getRandomAyat() {
        try {
            const randomSuratId = Math.floor(Math.random() * 114) + 1;
            const suratDetail = await this.getSuratDetail(randomSuratId);
            const randomAyatIndex = Math.floor(Math.random() * suratDetail.ayat.length);
            const randomAyat = suratDetail.ayat[randomAyatIndex];
            
            return {
                surat: {
                    nomor: suratDetail.nomor,
                    nama: suratDetail.nama,
                    namaLatin: suratDetail.namaLatin
                },
                ayat: randomAyat
            };
        } catch (error) {
            throw new Error(`Gagal mengambil ayat random: ${error.message}`);
        }
    }

    /**
     * Mendapatkan daftar nama qari yang tersedia
     * @returns {Array} Daftar qari
     */
    getAvailableQaris() {
        return [
            { key: 'abdullah_al_juhany', name: 'Abdullah Al-Juhany', id: '01' },
            { key: 'abdul_muhsin_al_qasim', name: 'Abdul Muhsin Al-Qasim', id: '02' },
            { key: 'abdurrahman_as_sudais', name: 'Abdurrahman As-Sudais', id: '03' },
            { key: 'ibrahim_al_dossari', name: 'Ibrahim Al-Dossari', id: '04' },
            { key: 'misyari_rasyid_al_afasy', name: 'Misyary Rasyid Al-Afasy', id: '05' }
        ];
    }

    /**
     * Validasi apakah surat ID valid
     * @param {string|number} suratId - ID surat
     * @returns {boolean} True jika valid
     */
    isValidSuratId(suratId) {
        const id = parseInt(suratId);
        return !isNaN(id) && id >= 1 && id <= 114;
    }

    /**
     * Validasi apakah ayat number valid untuk surat tertentu
     * @param {string|number} suratId - ID surat
     * @param {string|number} ayatNumber - Nomor ayat
     * @returns {Promise<boolean>} True jika valid
     */
    async isValidAyatNumber(suratId, ayatNumber) {
        try {
            const suratDetail = await this.getSuratDetail(suratId);
            const ayatNum = parseInt(ayatNumber);
            return !isNaN(ayatNum) && ayatNum >= 1 && ayatNum <= suratDetail.jumlahAyat;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get surat info without ayat (lighter request)
     * @param {string|number} suratId - ID surat
     * @returns {Promise<Object>} Basic surat info
     */
    async getSuratInfo(suratId) {
        try {
            const allSurat = await this.getSuratList();
            return allSurat.find(surat => surat.nomor == suratId);
        } catch (error) {
            throw new Error(`Gagal mendapatkan info surat: ${error.message}`);
        }
    }

    /**
     * Batch request untuk multiple surat (untuk performance)
     * @param {Array<number>} suratIds - Array of surat IDs
     * @returns {Promise<Array>} Array of surat details
     */
    async getMultipleSurat(suratIds) {
        try {
            const requests = suratIds.map(id => this.getSuratDetail(id));
            const results = await Promise.allSettled(requests);
            
            return results.map((result, index) => {
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    console.error(`Failed to load surat ${suratIds[index]}:`, result.reason);
                    return null;
                }
            }).filter(Boolean);
        } catch (error) {
            throw new Error(`Gagal memuat multiple surat: ${error.message}`);
        }
    }

    /**
     * Cache management untuk API responses
     */
    _cache = new Map();

    async getCachedData(key, fetchFunction) {
        if (this._cache.has(key)) {
            const cached = this._cache.get(key);
            // Cache valid for 1 hour
            if (Date.now() - cached.timestamp < 3600000) {
                return cached.data;
            } else {
                this._cache.delete(key);
            }
        }


        
        const data = await fetchFunction();
        this._cache.set(key, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this._cache.clear();
    }
}