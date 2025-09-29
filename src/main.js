// Main entry point untuk aplikasi Al-Qur'an Interaktif
import { QuranAPI } from './modules/api.js';
import { UIManager } from './modules/ui.js';
import { StorageManager } from './modules/storage.js';
import { AuthManager } from './modules/auth.js';
import { Utils } from './modules/utils.js';

class QuranApp {
    constructor() {
        this.api = new QuranAPI();
        this.ui = new UIManager();
        this.storage = new StorageManager();
        this.auth = new AuthManager();
        this.utils = new Utils();
        
        // State management
        this.state = {
            currentSurat: null,
            currentAyat: null,
            isPlaying: false,
            currentAudio: null,
            suratList: [],
            tafsirData: [],
            showTafsir: false,
            currentQari: '',
            sidebarVisible: true
        };

        this.init();
    }

    async init() {
        try {
            // Initialize theme
            this.initTheme();
            
            // Initialize authentication
            this.initAuth();
            
            // Load page-specific functionality
            const currentPage = this.getCurrentPage();
            
            if (currentPage === 'index') {
                await this.initIndexPage();
            } else if (currentPage === 'surat') {
                await this.initSuratPage();
            }

            // Initialize common functionality
            this.initCommonEvents();
            this.requestNotificationPermission();
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.ui.showNotification('Gagal memuat aplikasi', 'error');
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('surat.html')) return 'surat';
        return 'index';
    }

    initTheme() {
        const savedTheme = this.storage.getTheme();
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        this.storage.setTheme(newTheme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    initAuth() {
        const currentUser = this.auth.getCurrentUser();
        this.ui.updateAuthUI(currentUser);

        // Auth event listeners
        this.setupAuthEvents();
    }

    setupAuthEvents() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const modal = document.getElementById('auth-modal');
        const closeModal = document.querySelector('.modal-close');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.ui.showAuthModal('login');
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                this.ui.showAuthModal('register');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.auth.logout();
                this.ui.updateAuthUI(null);
                this.ui.showNotification('Berhasil logout', 'success');
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.ui.hideModal('auth-modal');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.ui.hideModal('auth-modal');
                }
            });
        }

        // Form submissions
        this.setupAuthFormSubmissions();
    }

    setupAuthFormSubmissions() {
        const loginSubmit = document.getElementById('login-submit');
        const registerSubmit = document.getElementById('register-submit');
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');

        if (loginSubmit) {
            loginSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerSubmit) {
            registerSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        if (showRegister) {
            showRegister.addEventListener('click', () => {
                this.ui.switchAuthForm('register');
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', () => {
                this.ui.switchAuthForm('login');
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) {
            this.ui.showNotification('Username dan password harus diisi', 'error');
            return;
        }

        try {
            const user = this.auth.login(username, password);
            this.ui.updateAuthUI(user);
            this.ui.hideModal('auth-modal');
            this.ui.showNotification(`Selamat datang, ${user.username}!`, 'success');
        } catch (error) {
            this.ui.showNotification(error.message, 'error');
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value.trim();
        const confirmPassword = document.getElementById('register-confirm').value.trim();

        if (!username || !password || !confirmPassword) {
            this.ui.showNotification('Semua field harus diisi', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.ui.showNotification('Password tidak sama', 'error');
            return;
        }

        if (password.length < 6) {
            this.ui.showNotification('Password minimal 6 karakter', 'error');
            return;
        }

        try {
            const user = this.auth.register(username, password);
            this.ui.updateAuthUI(user);
            this.ui.hideModal('auth-modal');
            this.ui.showNotification(`Akun ${user.username} berhasil dibuat!`, 'success');
        } catch (error) {
            this.ui.showNotification(error.message, 'error');
        }
    }

    async initIndexPage() {
        try {
            // Load surat list
            this.ui.showLoading('loading');
            const suratList = await this.api.getSuratList();
            this.state.suratList = suratList;
            
            this.ui.hideLoading('loading');
            this.ui.renderSuratGrid(suratList);

            // Setup search
            this.setupSearch();

            // Load history and bookmarks
            this.loadHistory();
            this.loadBookmarks();

            // Setup daily prayer notification
            this.setupDailyNotification();

        } catch (error) {
            console.error('Error loading index page:', error);
            this.ui.hideLoading('loading');
            this.ui.showNotification('Gagal memuat daftar surat', 'error');
        }
    }

    async initSuratPage() {
        try {
            // Load surat list for sidebar
            const suratList = await this.api.getSuratList();
            this.state.suratList = suratList;
            this.ui.renderSidebarSuratList(suratList);

            // Get surat ID from URL
            const suratId = this.utils.getUrlParameter('id') || '1';
            await this.loadSuratDetail(suratId);

            // Setup page events
            this.setupSuratPageEvents();

        } catch (error) {
            console.error('Error loading surat page:', error);
            this.ui.showNotification('Gagal memuat detail surat', 'error');
        }
    }

    async loadSuratDetail(suratId) {
        try {
            this.ui.showLoading('surat-header');
            this.ui.showLoading('ayat-list');

            const [suratDetail, tafsirData] = await Promise.all([
                this.api.getSuratDetail(suratId),
                this.api.getTafsir(suratId)
            ]);

            this.state.currentSurat = suratDetail;
            this.state.tafsirData = tafsirData;

            // Update URL
            this.utils.updateUrl('surat.html', { id: suratId });

            // Render surat content
            this.ui.renderSuratHeader(suratDetail);
            this.ui.renderAyatList(suratDetail.ayat);
            
            // Update sidebar active state
            this.ui.updateSidebarActive(suratId);

            // Update navigation buttons
            this.updateNavigationButtons(parseInt(suratId));

            // Add to history
            this.addToHistory(suratDetail);

            this.ui.hideLoading('surat-header');
            this.ui.hideLoading('ayat-list');

        } catch (error) {
            console.error('Error loading surat detail:', error);
            this.ui.hideLoading('surat-header');
            this.ui.hideLoading('ayat-list');
            this.ui.showNotification('Gagal memuat detail surat', 'error');
        }
    }

    setupSuratPageEvents() {
    this.setupTafsirAyatEvents(); // panggil method
    this.setupSidebarEvents();
    this.setupNavigationEvents();
    this.setupAudioEvents();
    this.setupBookmarkEvents();
    this.setupAyatSearch();
    this.setupTafsirToggle();
}

setupTafsirAyatEvents() {
    document.addEventListener('showAyatTafsir', (e) => {
        this.showAyatTafsir(e.detail.ayatNumber);
    });

    document.addEventListener('hideAyatTafsir', (e) => {
        this.hideAyatTafsir(e.detail.ayatNumber);
    });
}

async showAyatTafsir(ayatNumber) {
    try {
        // Cari tafsir dari data yang sudah di-load
        const tafsir = this.state.tafsirData?.tafsir?.find(t => t.ayat == ayatNumber);
        
        if (tafsir) {
            this.ui.renderAyatTafsir(ayatNumber, tafsir.teks);
        } else {
            // Jika tafsir tidak ada dalam data, tampilkan pesan
            this.ui.renderAyatTafsir(ayatNumber, null);
        }
    } catch (error) {
        console.error('Error showing tafsir:', error);
        this.ui.showNotification('Gagal memuat tafsir', 'error');
    }
}

hideAyatTafsir(ayatNumber) {
    this.ui.hideAyatTafsir(ayatNumber);
}


    setupSidebarEvents() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebarSearch = document.getElementById('sidebar-search');
        const sidebar = document.querySelector('.sidebar');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('show');
                this.state.sidebarVisible = !this.state.sidebarVisible;
            });
        }

        if (sidebarSearch) {
            sidebarSearch.addEventListener('input', (e) => {
                this.filterSidebarSurat(e.target.value);
            });
        }

        // Sidebar surat click events are handled in UI module
        document.addEventListener('sidebarSuratClick', (e) => {
            this.loadSuratDetail(e.detail.suratId);
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('show');
            }
        });
    }

    setupNavigationEvents() {
        const prevBtn = document.getElementById('prev-surat');
        const nextBtn = document.getElementById('next-surat');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const currentId = parseInt(this.state.currentSurat?.nomor);
                if (currentId > 1) {
                    this.loadSuratDetail(currentId - 1);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const currentId = parseInt(this.state.currentSurat?.nomor);
                if (currentId < 114) {
                    this.loadSuratDetail(currentId + 1);
                }
            });
        }
    }

    updateNavigationButtons(currentId) {
        const prevBtn = document.getElementById('prev-surat');
        const nextBtn = document.getElementById('next-surat');

        if (prevBtn) {
            prevBtn.disabled = currentId <= 1;
        }

        if (nextBtn) {
            nextBtn.disabled = currentId >= 114;
        }
    }

    setupAudioEvents() {
        const qariSelector = document.getElementById('qari-selector');
        
        if (qariSelector) {
            qariSelector.addEventListener('change', (e) => {
                this.state.currentQari = e.target.value;
                this.ui.updateAudioButtons(this.state.currentQari);
            });
        }

        // Audio control events are handled in UI module
        document.addEventListener('playAyatAudio', (e) => {
            this.playAyatAudio(e.detail.ayatNumber);
        });

        document.addEventListener('pauseAudio', () => {
            this.pauseCurrentAudio();
        });

        document.addEventListener('stopAudio', () => {
            this.stopCurrentAudio();
        });
    }

    async playAyatAudio(ayatNumber) {
    if (!this.state.currentQari) {
        this.ui.showNotification('Pilih qari terlebih dahulu', 'warning');
        return;
    }

    try {
        // Method 1: Gunakan URL langsung dari API data
        const audioUrl = await this.api.getAyatAudioUrl(
            this.state.currentSurat.nomor, 
            ayatNumber, 
            this.state.currentQari
        );

        // Method 2: Atau gunakan method konstruksi URL yang sudah diperbaiki
        // const audioUrl = this.api.getAudioUrl(
        //     this.state.currentSurat.nomor, 
        //     ayatNumber, 
        //     this.state.currentQari
        // );

        // Stop current audio if playing
        this.stopCurrentAudio();

        // Create new audio element
        const audio = new Audio(audioUrl);
        this.state.currentAudio = audio;
        this.state.isPlaying = true;

        audio.addEventListener('loadstart', () => {
            this.ui.showNotification('Memuat audio...', 'info');
        });

        audio.addEventListener('canplay', () => {
            this.ui.showNotification(`Memutar ayat ${ayatNumber}`, 'success');
        });

        audio.addEventListener('ended', () => {
            this.state.isPlaying = false;
            this.state.currentAudio = null;
            this.ui.showNotification('Audio selesai', 'info');
        });

        audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.ui.showNotification('Gagal memuat audio', 'error');
            this.state.isPlaying = false;
            this.state.currentAudio = null;
        });

        await audio.play();

    } catch (error) {
        console.error('Error playing audio:', error);
        this.ui.showNotification(`Gagal memutar audio: ${error.message}`, 'error');
    }
}

    pauseCurrentAudio() {
        if (this.state.currentAudio && this.state.isPlaying) {
            this.state.currentAudio.pause();
            this.state.isPlaying = false;
        }
    }

    stopCurrentAudio() {
        if (this.state.currentAudio) {
            this.state.currentAudio.pause();
            this.state.currentAudio.currentTime = 0;
            this.state.currentAudio = null;
            this.state.isPlaying = false;
        }
    }

    setupBookmarkEvents() {
        const bookmarkBtn = document.getElementById('bookmark-surat');
        
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                this.toggleSuratBookmark();
            });
        }

        // Individual ayat bookmark events handled in UI
        document.addEventListener('toggleAyatBookmark', (e) => {
            this.toggleAyatBookmark(e.detail.ayatNumber);
        });
    }

    toggleSuratBookmark() {
        if (!this.state.currentSurat) return;

        const bookmarks = this.storage.getBookmarks();
        const suratId = this.state.currentSurat.nomor;
        const isBookmarked = bookmarks.surat.some(s => s.nomor === suratId);

        if (isBookmarked) {
            this.storage.removeBookmark('surat', suratId);
            this.ui.showNotification('Bookmark surat dihapus', 'info');
        } else {
            this.storage.addBookmark('surat', this.state.currentSurat);
            this.ui.showNotification('Surat ditambahkan ke bookmark', 'success');
        }

        this.ui.updateBookmarkButton('bookmark-surat', !isBookmarked);
    }

    toggleAyatBookmark(ayatNumber) {
        if (!this.state.currentSurat) return;

        const bookmarks = this.storage.getBookmarks();
        const ayat = this.state.currentSurat.ayat.find(a => a.nomorAyat === ayatNumber);
        const bookmarkKey = `${this.state.currentSurat.nomor}-${ayatNumber}`;
        const isBookmarked = bookmarks.ayat.some(a => 
            a.suratId === this.state.currentSurat.nomor && a.nomorAyat === ayatNumber
        );

        if (isBookmarked) {
            this.storage.removeBookmark('ayat', bookmarkKey);
            this.ui.showNotification(`Bookmark ayat ${ayatNumber} dihapus`, 'info');
        } else {
            const bookmarkData = {
                suratId: this.state.currentSurat.nomor,
                suratNama: this.state.currentSurat.nama,
                nomorAyat: ayatNumber,
                teksArab: ayat.teksArab,
                teksIndonesia: ayat.teksIndonesia
            };
            this.storage.addBookmark('ayat', bookmarkData);
            this.ui.showNotification(`Ayat ${ayatNumber} ditambahkan ke bookmark`, 'success');
        }

        this.ui.updateBookmarkButton(`bookmark-ayat-${ayatNumber}`, !isBookmarked);
    }

    setupAyatSearch() {
        const searchInput = document.getElementById('ayat-search');
        const searchBtn = document.getElementById('ayat-search-btn');

        if (searchInput && searchBtn) {
            const performSearch = () => {
                const query = searchInput.value.trim();
                this.searchAyat(query);
            };

            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
    }

    searchAyat(query) {
        if (!query || !this.state.currentSurat) return;

        const ayatList = this.state.currentSurat.ayat;
        let filteredAyat = ayatList;

        // Search by ayat number
        if (/^\d+$/.test(query)) {
            const ayatNumber = parseInt(query);
            filteredAyat = ayatList.filter(ayat => ayat.nomorAyat === ayatNumber);
        } 
        // Search by text content
        else {
            filteredAyat = ayatList.filter(ayat => 
                ayat.teksIndonesia.toLowerCase().includes(query.toLowerCase()) ||
                ayat.teksArab.includes(query)
            );
        }

        this.ui.renderAyatList(filteredAyat, query);
        
        if (filteredAyat.length === 0) {
            this.ui.showNotification('Tidak ada ayat yang ditemukan', 'info');
        } else {
            this.ui.showNotification(`Ditemukan ${filteredAyat.length} ayat`, 'success');
        }
    }

    setupTafsirToggle() {
        const tafsirBtn = document.getElementById('toggle-tafsir');
        
        if (tafsirBtn) {
            tafsirBtn.addEventListener('click', () => {
                this.toggleTafsir();
            });
        }
    }

    toggleTafsir() {
        this.state.showTafsir = !this.state.showTafsir;
        const tafsirSection = document.getElementById('tafsir-section');
        const tafsirBtn = document.getElementById('toggle-tafsir');

        if (tafsirSection) {
            if (this.state.showTafsir) {
                tafsirSection.classList.remove('hidden');
                this.ui.renderTafsir(this.state.tafsirData);
                if (tafsirBtn) tafsirBtn.classList.add('active');
            } else {
                tafsirSection.classList.add('hidden');
                if (tafsirBtn) tafsirBtn.classList.remove('active');
            }
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');

        if (searchInput && searchBtn) {
            const performSearch = () => {
                const query = searchInput.value.trim();
                this.searchSurat(query);
            };

            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
    }

    searchSurat(query) {
        if (!query) {
            this.ui.renderSuratGrid(this.state.suratList);
            return;
        }

        const filteredSurat = this.state.suratList.filter(surat => 
            surat.nama.toLowerCase().includes(query.toLowerCase()) ||
            surat.namaLatin.toLowerCase().includes(query.toLowerCase()) ||
            surat.nomor.toString().includes(query)
        );

        this.ui.renderSuratGrid(filteredSurat);
        
        if (filteredSurat.length === 0) {
            this.ui.showNotification('Tidak ada surat yang ditemukan', 'info');
        }
    }

    filterSidebarSurat(query) {
        if (!query) {
            this.ui.renderSidebarSuratList(this.state.suratList);
            return;
        }

        const filteredSurat = this.state.suratList.filter(surat => 
            surat.nama.toLowerCase().includes(query.toLowerCase()) ||
            surat.namaLatin.toLowerCase().includes(query.toLowerCase()) ||
            surat.nomor.toString().includes(query)
        );

        this.ui.renderSidebarSuratList(filteredSurat);
    }

    loadHistory() {
        const history = this.storage.getHistory();
        this.ui.renderHistory(history);
    }

    loadBookmarks() {
        const bookmarks = this.storage.getBookmarks();
        this.ui.renderBookmarks(bookmarks);
    }

    addToHistory(surat) {
        const historyItem = {
            nomor: surat.nomor,
            nama: surat.nama,
            namaLatin: surat.namaLatin,
            timestamp: Date.now()
        };
        
        this.storage.addHistory(historyItem);
    }

    setupDailyNotification() {
        // Setup daily prayer reminder
        const now = new Date();
        const reminderTime = new Date();
        reminderTime.setHours(7, 0, 0, 0); // 7 AM

        if (now > reminderTime) {
            reminderTime.setDate(reminderTime.getDate() + 1);
        }

        const timeUntilReminder = reminderTime.getTime() - now.getTime();

        setTimeout(() => {
            this.showDailyNotification();
            // Repeat daily
            setInterval(() => {
                this.showDailyNotification();
            }, 24 * 60 * 60 * 1000);
        }, timeUntilReminder);
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (error) {
                console.log('Notification permission denied');
            }
        }
    }

    showDailyNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notifications = [
                'Waktunya membaca Al-Qur\'an hari ini 📖',
                'Jangan lupa berdoa dan berdzikir 🤲',
                'Luangkan waktu untuk tilawah Al-Qur\'an ✨',
                'Semoga hari ini penuh berkah 🌟'
            ];
            
            const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
            
            new Notification('Al-Qur\'an Interaktif', {
                body: randomNotification,
                icon: '/assets/img/icon-192.png',
                badge: '/assets/img/badge-72.png'
            });
        } else {
            // Fallback to in-app notification
            this.ui.showNotification('Waktunya membaca Al-Qur\'an hari ini 📖', 'info');
        }
    }

    initCommonEvents() {
        // Close notification
        const notificationClose = document.getElementById('notification-close');
        if (notificationClose) {
            notificationClose.addEventListener('click', () => {
                this.ui.hideNotification();
            });
        }

        // Auto-hide notifications
        document.addEventListener('notificationShown', () => {
            setTimeout(() => {
                this.ui.hideNotification();
            }, 5000);
        });

        // Handle window resize for sidebar
        window.addEventListener('resize', () => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar && window.innerWidth > 768) {
                sidebar.classList.remove('show');
            }
        });

        // Handle back/forward navigation
        window.addEventListener('popstate', () => {
            const currentPage = this.getCurrentPage();
            if (currentPage === 'surat') {
                const suratId = this.utils.getUrlParameter('id') || '1';
                this.loadSuratDetail(suratId);
            }
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quranApp = new QuranApp();
});

// Export for global access
export default QuranApp;

// Dalam constructor, tambah state:
this.state = {
    // state existing...
    showTafsir: false,
    currentTafsirAyat: null, // untuk menyimpan tafsir ayat yang sedang dilihat
    tafsirData: []
};

