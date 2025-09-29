/**
 * StorageManager - Handler untuk localStorage operations
 * Mengelola bookmark, history, tema, dan data user
 */
export class StorageManager {
    constructor() {
        this.keys = {
            BOOKMARKS: 'quran_bookmarks',
            HISTORY: 'quran_history',
            THEME: 'quran_theme',
            USER: 'quran_user',
            SETTINGS: 'quran_settings'
        };

        // Initialize default data if not exists
        this.initializeStorage();
    }

    /**
     * Initialize storage with default values
     */
    initializeStorage() {
        if (!this.getItem(this.keys.BOOKMARKS)) {
            this.setItem(this.keys.BOOKMARKS, {
                surat: [],
                ayat: []
            });
        }

        if (!this.getItem(this.keys.HISTORY)) {
            this.setItem(this.keys.HISTORY, []);
        }

        if (!this.getItem(this.keys.THEME)) {
            this.setItem(this.keys.THEME, 'light');
        }

        if (!this.getItem(this.keys.SETTINGS)) {
            this.setItem(this.keys.SETTINGS, {
                autoPlayAudio: false,
                showTransliteration: true,
                showTranslation: true,
                fontSize: 'medium',
                qariPreference: '',
                notificationsEnabled: true
            });
        }
    }

    /**
     * Generic localStorage operations with error handling
     */
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error saving to localStorage [${key}]:`, error);
            return false;
        }
    }

    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error reading from localStorage [${key}]:`, error);
            return null;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage [${key}]:`, error);
            return false;
        }
    }

    /**
     * Theme Management
     */
    getTheme() {
        return this.getItem(this.keys.THEME) || 'light';
    }

    setTheme(theme) {
        if (['light', 'dark'].includes(theme)) {
            return this.setItem(this.keys.THEME, theme);
        }
        return false;
    }

    /**
     * Bookmark Management
     */
    getBookmarks() {
        return this.getItem(this.keys.BOOKMARKS) || { surat: [], ayat: [] };
    }

    addBookmark(type, data) {
        const bookmarks = this.getBookmarks();
        
        if (type === 'surat') {
            // Check if surat already bookmarked
            const exists = bookmarks.surat.some(s => s.nomor === data.nomor);
            if (!exists) {
                bookmarks.surat.unshift({
                    nomor: data.nomor,
                    nama: data.nama,
                    namaLatin: data.namaLatin,
                    jumlahAyat: data.jumlahAyat,
                    tempatTurun: data.tempatTurun,
                    timestamp: Date.now()
                });
            }
        } else if (type === 'ayat') {
            // Check if ayat already bookmarked
            const exists = bookmarks.ayat.some(a => 
                a.suratId === data.suratId && a.nomorAyat === data.nomorAyat
            );
            if (!exists) {
                bookmarks.ayat.unshift({
                    suratId: data.suratId,
                    suratNama: data.suratNama,
                    nomorAyat: data.nomorAyat,
                    teksArab: data.teksArab,
                    teksIndonesia: data.teksIndonesia,
                    timestamp: Date.now()
                });
            }
        }

        return this.setItem(this.keys.BOOKMARKS, bookmarks);
    }

    removeBookmark(type, identifier) {
        const bookmarks = this.getBookmarks();
        
        if (type === 'surat') {
            bookmarks.surat = bookmarks.surat.filter(s => s.nomor !== identifier);
        } else if (type === 'ayat') {
            // identifier format: "suratId-ayatNumber"
            const [suratId, ayatNumber] = identifier.split('-').map(Number);
            bookmarks.ayat = bookmarks.ayat.filter(a => 
                !(a.suratId === suratId && a.nomorAyat === ayatNumber)
            );
        }

        return this.setItem(this.keys.BOOKMARKS, bookmarks);
    }

    isBookmarked(type, identifier) {
        const bookmarks = this.getBookmarks();
        
        if (type === 'surat') {
            return bookmarks.surat.some(s => s.nomor === identifier);
        } else if (type === 'ayat') {
            const [suratId, ayatNumber] = identifier.split('-').map(Number);
            return bookmarks.ayat.some(a => 
                a.suratId === suratId && a.nomorAyat === ayatNumber
            );
        }
        
        return false;
    }

    clearBookmarks() {
        return this.setItem(this.keys.BOOKMARKS, { surat: [], ayat: [] });
    }

    /**
     * History Management
     */
    getHistory() {
        return this.getItem(this.keys.HISTORY) || [];
    }

    addHistory(suratData) {
        let history = this.getHistory();
        
        // Remove existing entry if exists
        history = history.filter(h => h.nomor !== suratData.nomor);
        
        // Add to beginning
        history.unshift({
            nomor: suratData.nomor,
            nama: suratData.nama,
            namaLatin: suratData.namaLatin,
            timestamp: Date.now()
        });

        // Keep only last 50 entries
        if (history.length > 50) {
            history = history.slice(0, 50);
        }

        return this.setItem(this.keys.HISTORY, history);
    }

    removeFromHistory(suratId) {
        const history = this.getHistory();
        const updatedHistory = history.filter(h => h.nomor !== suratId);
        return this.setItem(this.keys.HISTORY, updatedHistory);
    }

    clearHistory() {
        return this.setItem(this.keys.HISTORY, []);
    }

    /**
     * User Management
     */
    getCurrentUser() {
        return this.getItem(this.keys.USER);
    }

    setCurrentUser(userData) {
        return this.setItem(this.keys.USER, {
            username: userData.username,
            loginTime: Date.now(),
            lastActive: Date.now()
        });
    }

    clearCurrentUser() {
        return this.removeItem(this.keys.USER);
    }

    updateLastActive() {
        const user = this.getCurrentUser();
        if (user) {
            user.lastActive = Date.now();
            return this.setItem(this.keys.USER, user);
        }
        return false;
    }

    /**
     * Settings Management
     */
    getSettings() {
        return this.getItem(this.keys.SETTINGS) || {
            autoPlayAudio: false,
            showTransliteration: true,
            showTranslation: true,
            fontSize: 'medium',
            qariPreference: '',
            notificationsEnabled: true
        };
    }

    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.setItem(this.keys.SETTINGS, settings);
    }

    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        return this.setItem(this.keys.SETTINGS, updatedSettings);
    }

    resetSettings() {
        const defaultSettings = {
            autoPlayAudio: false,
            showTransliteration: true,
            showTranslation: true,
            fontSize: 'medium',
            qariPreference: '',
            notificationsEnabled: true
        };
        return this.setItem(this.keys.SETTINGS, defaultSettings);
    }

    /**
     * Export/Import Functions
     */
    exportData() {
        const data = {
            bookmarks: this.getBookmarks(),
            history: this.getHistory(),
            settings: this.getSettings(),
            theme: this.getTheme(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.version || !data.bookmarks) {
                throw new Error('Invalid data format');
            }

            // Import bookmarks
            if (data.bookmarks) {
                this.setItem(this.keys.BOOKMARKS, data.bookmarks);
            }

            // Import history
            if (data.history) {
                this.setItem(this.keys.HISTORY, data.history);
            }

            // Import settings
            if (data.settings) {
                this.setItem(this.keys.SETTINGS, data.settings);
            }

            // Import theme
            if (data.theme) {
                this.setItem(this.keys.THEME, data.theme);
            }

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Statistics
     */
    getStatistics() {
        const bookmarks = this.getBookmarks();
        const history = this.getHistory();
        const settings = this.getSettings();

        return {
            totalSuratBookmarks: bookmarks.surat.length,
            totalAyatBookmarks: bookmarks.ayat.length,
            totalHistoryEntries: history.length,
            mostReadSurat: this.getMostReadSurat(history),
            lastActivity: this.getLastActivity(history),
            currentTheme: this.getTheme(),
            settingsConfigured: Object.keys(settings).length
        };
    }

    getMostReadSurat(history) {
        if (!history || history.length === 0) return null;

        const suratCount = {};
        history.forEach(item => {
            suratCount[item.nomor] = (suratCount[item.nomor] || 0) + 1;
        });

        let mostRead = null;
        let maxCount = 0;
        
        Object.entries(suratCount).forEach(([suratId, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mostRead = history.find(h => h.nomor == suratId);
            }
        });

        return mostRead ? { ...mostRead, readCount: maxCount } : null;
    }

    getLastActivity(history) {
        if (!history || history.length === 0) return null;
        return history[0]; // History is sorted by timestamp desc
    }

    /**
     * Search functions
     */
    searchBookmarks(query) {
        const bookmarks = this.getBookmarks();
        const searchTerm = query.toLowerCase();
        
        const filteredSurat = bookmarks.surat.filter(surat =>
            surat.namaLatin.toLowerCase().includes(searchTerm) ||
            surat.nama.includes(searchTerm)
        );

        const filteredAyat = bookmarks.ayat.filter(ayat =>
            ayat.suratNama.toLowerCase().includes(searchTerm) ||
            ayat.teksIndonesia.toLowerCase().includes(searchTerm)
        );

        return {
            surat: filteredSurat,
            ayat: filteredAyat
        };
    }

    searchHistory(query) {
        const history = this.getHistory();
        const searchTerm = query.toLowerCase();
        
        return history.filter(item =>
            item.namaLatin.toLowerCase().includes(searchTerm) ||
            item.nama.includes(searchTerm)
        );
    }

    /**
     * Data cleanup functions
     */
    cleanupOldData() {
        // Clean history older than 6 months
        const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
        const history = this.getHistory();
        const recentHistory = history.filter(item => item.timestamp > sixMonthsAgo);
        
        if (recentHistory.length !== history.length) {
            this.setItem(this.keys.HISTORY, recentHistory);
        }

        // Clean old bookmarks metadata if needed
        const bookmarks = this.getBookmarks();
        let updated = false;

        // Ensure all bookmarks have timestamps
        bookmarks.surat.forEach(surat => {
            if (!surat.timestamp) {
                surat.timestamp = Date.now();
                updated = true;
            }
        });

        bookmarks.ayat.forEach(ayat => {
            if (!ayat.timestamp) {
                ayat.timestamp = Date.now();
                updated = true;
            }
        });

        if (updated) {
            this.setItem(this.keys.BOOKMARKS, bookmarks);
        }
    }

    /**
     * Storage size calculation
     */
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key) && key.startsWith('quran_')) {
                total += localStorage[key].length + key.length;
            }
        }
        return {
            bytes: total,
            kilobytes: (total / 1024).toFixed(2),
            megabytes: (total / (1024 * 1024)).toFixed(2)
        };
    }

    /**
     * Clear all app data
     */
    clearAllData() {
        const keys = Object.values(this.keys);
        keys.forEach(key => {
            this.removeItem(key);
        });
        
        // Reinitialize with defaults
        this.initializeStorage();
        
        return true;
    }

    /**
     * Backup management
     */
    createBackup() {
        const backup = {
            data: {
                bookmarks: this.getBookmarks(),
                history: this.getHistory(),
                settings: this.getSettings(),
                theme: this.getTheme()
            },
            metadata: {
                createdAt: new Date().toISOString(),
                version: '1.0',
                userAgent: navigator.userAgent
            }
        };

        return JSON.stringify(backup);
    }

    restoreBackup(backupData) {
        try {
            const backup = JSON.parse(backupData);
            
            if (!backup.data || !backup.metadata) {
                throw new Error('Invalid backup format');
            }

            const { data } = backup;
            
            if (data.bookmarks) this.setItem(this.keys.BOOKMARKS, data.bookmarks);
            if (data.history) this.setItem(this.keys.HISTORY, data.history);
            if (data.settings) this.setItem(this.keys.SETTINGS, data.settings);
            if (data.theme) this.setItem(this.keys.THEME, data.theme);

            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }

    /**
     * Migration functions for future versions
     */
    migrateData(fromVersion, toVersion) {
        console.log(`Migrating data from v${fromVersion} to v${toVersion}`);
        
        // Future migration logic would go here
        // For now, just ensure all required keys exist
        this.initializeStorage();
        
        return true;
    }

    /**
     * Utility functions
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    getQuotaUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate();
        }
        return Promise.resolve({ usage: 0, quota: 0 });
    }
}