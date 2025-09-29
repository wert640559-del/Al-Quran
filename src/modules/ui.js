/**
 * UIManager - Handler untuk semua manipulasi DOM dan rendering UI
 */
export class UIManager {
    constructor() {
        this.currentModal = null;
        this.notificationTimeout = null;
    }

    /**
     * Render daftar surat di halaman index
     * @param {Array} suratList - Array of surat objects
     */
    renderSuratGrid(suratList) {
        const container = document.getElementById('surat-grid');
        if (!container) return;

        container.innerHTML = '';

        if (!suratList || suratList.length === 0) {
            container.innerHTML = '<div class="text-center">Tidak ada surat ditemukan</div>';
            return;
        }

        suratList.forEach(surat => {
            const suratCard = this.createSuratCard(surat);
            container.appendChild(suratCard);
        });
    }

    /**
     * Membuat element card surat
     * @param {Object} surat - Surat object
     * @returns {HTMLElement} Surat card element
     */
    createSuratCard(surat) {
        const card = document.createElement('div');
        card.className = 'surat-card';
        card.onclick = () => {
            window.location.href = `surat.html?id=${surat.nomor}`;
        };

        card.innerHTML = `
            <div class="surat-card-header">
                <div class="surat-number">${surat.nomor}</div>
                <div class="surat-arabic">${surat.nama}</div>
            </div>
            <h3 class="surat-name">${surat.namaLatin}</h3>
            <p class="surat-transliteration">${surat.arti}</p>
            <div class="surat-info">
                <span>${surat.tempatTurun}</span>
                <span>${surat.jumlahAyat} Ayat</span>
            </div>
        `;

        return card;
    }

    /**
     * Render sidebar list surat di halaman detail
     * @param {Array} suratList - Array of surat objects
     */
    renderSidebarSuratList(suratList) {
        const container = document.getElementById('sidebar-surat-list');
        if (!container) return;

        container.innerHTML = '';

        if (!suratList || suratList.length === 0) {
            container.innerHTML = '<div class="loading">Tidak ada surat ditemukan</div>';
            return;
        }

        suratList.forEach(surat => {
            const suratItem = this.createSidebarSuratItem(surat);
            container.appendChild(suratItem);
        });
    }

    /**
     * Membuat element item surat untuk sidebar
     * @param {Object} surat - Surat object
     * @returns {HTMLElement} Sidebar surat item element
     */
    createSidebarSuratItem(surat) {
        const item = document.createElement('div');
        item.className = 'sidebar-surat-item';
        item.dataset.suratId = surat.nomor;
        
        item.onclick = () => {
            this.dispatchCustomEvent('sidebarSuratClick', { suratId: surat.nomor });
        };

        item.innerHTML = `
            <div>
                <span class="sidebar-surat-number">${surat.nomor}.</span>
                <span class="sidebar-surat-name">${surat.namaLatin}</span>
            </div>
            <div class="sidebar-surat-info">${surat.tempatTurun} • ${surat.jumlahAyat} Ayat</div>
        `;

        return item;
    }

    /**
     * Update active state di sidebar
     * @param {string|number} suratId - ID surat yang aktif
     */
    updateSidebarActive(suratId) {
        const items = document.querySelectorAll('.sidebar-surat-item');
        items.forEach(item => {
            if (item.dataset.suratId == suratId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Render header surat
     * @param {Object} surat - Surat object with details
     */
    renderSuratHeader(surat) {
        const container = document.getElementById('surat-header');
        if (!container) return;

        container.innerHTML = `
            <div class="surat-header-arabic">${surat.nama}</div>
            <h1 class="surat-header-name">${surat.namaLatin}</h1>
            <p class="surat-header-transliteration">${surat.arti}</p>
            <div class="surat-header-info">
                <div class="surat-info-item">
                    <div class="surat-info-label">Nomor</div>
                    <div class="surat-info-value">${surat.nomor}</div>
                </div>
                <div class="surat-info-item">
                    <div class="surat-info-label">Jumlah Ayat</div>
                    <div class="surat-info-value">${surat.jumlahAyat}</div>
                </div>
                <div class="surat-info-item">
                    <div class="surat-info-label">Tempat Turun</div>
                    <div class="surat-info-value">${surat.tempatTurun}</div>
                </div>
            </div>
        `;

        // Update page title
        document.title = `${surat.namaLatin} - Al-Qur'an Interaktif`;
    }

    /**
     * Render daftar ayat
     * @param {Array} ayatList - Array of ayat objects
     * @param {string} highlightQuery - Query to highlight in text
     */
    renderAyatList(ayatList, highlightQuery = '') {
        const container = document.getElementById('ayat-list');
        if (!container) return;

        container.innerHTML = '';

        if (!ayatList || ayatList.length === 0) {
            container.innerHTML = '<div class="text-center">Tidak ada ayat ditemukan</div>';
            return;
        }

        ayatList.forEach(ayat => {
            const ayatItem = this.createAyatItem(ayat, highlightQuery);
            container.appendChild(ayatItem);
        });
    }

    /**
     * Membuat element item ayat
     * @param {Object} ayat - Ayat object
     * @param {string} highlightQuery - Query to highlight
     * @returns {HTMLElement} Ayat item element
     */
    createAyatItem(ayat, highlightQuery = '') {
    const item = document.createElement('div');
    item.className = 'ayat-item';
    item.id = `ayat-${ayat.nomorAyat}`;

    // Highlight text if query provided
    let teksIndonesia = ayat.teksIndonesia;
    let teksLatin = ayat.teksLatin;
    
    if (highlightQuery && highlightQuery.length > 0) {
        const regex = new RegExp(`(${highlightQuery})`, 'gi');
        teksIndonesia = teksIndonesia.replace(regex, '<mark>$1</mark>');
        teksLatin = teksLatin.replace(regex, '<mark>$1</mark>');
    }

    item.innerHTML = `
        <div class="ayat-header">
            <div class="ayat-number">${ayat.nomorAyat}</div>
            <div class="ayat-controls">
                <button class="ayat-control-btn" onclick="this.dispatchEvent(new CustomEvent('playAyatAudio', { bubbles: true, detail: { ayatNumber: ${ayat.nomorAyat} } }))" title="Putar Audio">
                    🔊
                </button>
                <button class="ayat-control-btn tafsir-btn" onclick="this.dispatchEvent(new CustomEvent('showAyatTafsir', { bubbles: true, detail: { ayatNumber: ${ayat.nomorAyat} } }))" title="Tafsir Ayat">
                    📖
                </button>
                <button class="ayat-control-btn" id="bookmark-ayat-${ayat.nomorAyat}" onclick="this.dispatchEvent(new CustomEvent('toggleAyatBookmark', { bubbles: true, detail: { ayatNumber: ${ayat.nomorAyat} } }))" title="Bookmark Ayat">
                    ⭐
                </button>
                <button class="ayat-control-btn" onclick="this.copyAyatText(${ayat.nomorAyat})" title="Copy Ayat">
                    📋
                </button>
            </div>
        </div>
        <div class="ayat-arabic" dir="rtl">${ayat.teksArab}</div>
        <div class="ayat-transliteration">${teksLatin}</div>
        <div class="ayat-translation">${teksIndonesia}</div>
        <div id="tafsir-ayat-${ayat.nomorAyat}" class="ayat-tafsir hidden"></div>
    `;

    return item;
}

    /**
     * Render tafsir content
     * @param {Object} tafsirData - Tafsir data object
     */
    renderTafsir(tafsirData) {
        const container = document.getElementById('tafsir-content');
        if (!container || !tafsirData) return;

        container.innerHTML = '';

        if (!tafsirData.tafsir || tafsirData.tafsir.length === 0) {
            container.innerHTML = '<div class="text-center">Tafsir tidak tersedia</div>';
            return;
        }

        tafsirData.tafsir.forEach(tafsir => {
            const tafsirItem = this.createTafsirItem(tafsir);
            container.appendChild(tafsirItem);
        });
    }

    /**
     * Membuat element item tafsir
     * @param {Object} tafsir - Tafsir object
     * @returns {HTMLElement} Tafsir item element
     */
    createTafsirItem(tafsir) {
        const item = document.createElement('div');
        item.className = 'tafsir-item';

        item.innerHTML = `
            <div class="tafsir-ayat-number">Ayat ${tafsir.ayat}</div>
            <div class="tafsir-text">${tafsir.teks}</div>
        `;

        return item;
    }

    /**
 * Render tafsir untuk ayat tertentu
 * @param {number} ayatNumber - Nomor ayat
 * @param {string} tafsirText - Teks tafsir
 */
renderAyatTafsir(ayatNumber, tafsirText) {
    const tafsirElement = document.getElementById(`tafsir-ayat-${ayatNumber}`);
    if (!tafsirElement) return;

    if (tafsirText) {
        tafsirElement.innerHTML = `
            <div class="tafsir-content">
                <h4>Tafsir Ayat ${ayatNumber}</h4>
                <div class="tafsir-text">${tafsirText}</div>
                <button class="close-tafsir-btn" onclick="this.dispatchEvent(new CustomEvent('hideAyatTafsir', { bubbles: true, detail: { ayatNumber: ${ayatNumber} } }))">
                    Tutup Tafsir
                </button>
            </div>
        `;
        tafsirElement.classList.remove('hidden');
    } else {
        tafsirElement.innerHTML = '<div class="tafsir-empty">Tafsir tidak tersedia</div>';
        tafsirElement.classList.remove('hidden');
    }
}

/**
 * Sembunyikan tafsir ayat
 * @param {number} ayatNumber - Nomor ayat
 */
hideAyatTafsir(ayatNumber) {
    const tafsirElement = document.getElementById(`tafsir-ayat-${ayatNumber}`);
    if (tafsirElement) {
        tafsirElement.classList.add('hidden');
    }
}

    /**
     * Render riwayat bacaan
     * @param {Array} historyList - Array of history items
     */
    renderHistory(historyList) {
        const container = document.getElementById('recent-history');
        if (!container) return;

        container.innerHTML = '';

        if (!historyList || historyList.length === 0) {
            container.innerHTML = '<div class="text-center">Belum ada riwayat bacaan</div>';
            return;
        }

        // Show only last 6 items
        const recentHistory = historyList.slice(0, 6);

        recentHistory.forEach(item => {
            const historyItem = this.createHistoryItem(item);
            container.appendChild(historyItem);
        });
    }

    /**
     * Membuat element item history
     * @param {Object} item - History item object
     * @returns {HTMLElement} History item element
     */
    createHistoryItem(item) {
        const element = document.createElement('div');
        element.className = 'history-item';
        element.onclick = () => {
            window.location.href = `surat.html?id=${item.nomor}`;
        };

        const date = new Date(item.timestamp);
        const dateStr = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        element.innerHTML = `
            <div><strong>${item.namaLatin}</strong></div>
            <div class="text-secondary">${item.nama}</div>
            <div class="text-light" style="font-size: 0.8rem; margin-top: 0.5rem;">${dateStr}</div>
        `;

        return element;
    }

    /**
     * Render bookmark list
     * @param {Object} bookmarks - Bookmarks object with surat and ayat arrays
     */
    renderBookmarks(bookmarks) {
        const container = document.getElementById('bookmarks-list');
        if (!container) return;

        container.innerHTML = '';

        const totalBookmarks = (bookmarks.surat?.length || 0) + (bookmarks.ayat?.length || 0);

        if (totalBookmarks === 0) {
            container.innerHTML = '<div class="text-center">Belum ada bookmark tersimpan</div>';
            return;
        }

        // Render surat bookmarks
        if (bookmarks.surat && bookmarks.surat.length > 0) {
            bookmarks.surat.forEach(surat => {
                const bookmarkItem = this.createSuratBookmarkItem(surat);
                container.appendChild(bookmarkItem);
            });
        }

        // Render ayat bookmarks (show only recent 6)
        if (bookmarks.ayat && bookmarks.ayat.length > 0) {
            const recentAyat = bookmarks.ayat.slice(0, 6);
            recentAyat.forEach(ayat => {
                const bookmarkItem = this.createAyatBookmarkItem(ayat);
                container.appendChild(bookmarkItem);
            });
        }
    }

    /**
     * Membuat element bookmark surat
     * @param {Object} surat - Surat bookmark object
     * @returns {HTMLElement} Surat bookmark element
     */
    createSuratBookmarkItem(surat) {
        const element = document.createElement('div');
        element.className = 'bookmark-item';
        element.onclick = () => {
            window.location.href = `surat.html?id=${surat.nomor}`;
        };

        element.innerHTML = `
            <div><strong>${surat.namaLatin}</strong></div>
            <div class="text-secondary">${surat.nama}</div>
            <div class="text-light" style="font-size: 0.8rem;">Surat • ${surat.jumlahAyat} Ayat</div>
        `;

        return element;
    }

    /**
     * Membuat element bookmark ayat
     * @param {Object} ayat - Ayat bookmark object
     * @returns {HTMLElement} Ayat bookmark element
     */
    createAyatBookmarkItem(ayat) {
        const element = document.createElement('div');
        element.className = 'bookmark-item';
        element.onclick = () => {
            window.location.href = `surat.html?id=${ayat.suratId}#ayat-${ayat.nomorAyat}`;
        };

        // Truncate translation if too long
        const translation = ayat.teksIndonesia.length > 80 
            ? ayat.teksIndonesia.substring(0, 80) + '...'
            : ayat.teksIndonesia;

        element.innerHTML = `
            <div><strong>${ayat.suratNama} : ${ayat.nomorAyat}</strong></div>
            <div class="text-secondary" style="font-size: 0.9rem;">${translation}</div>
        `;

        return element;
    }

    /**
     * Update bookmark button state
     * @param {string} buttonId - ID of bookmark button
     * @param {boolean} isBookmarked - Whether item is bookmarked
     */
    updateBookmarkButton(buttonId, isBookmarked) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (isBookmarked) {
            button.classList.add('active');
            button.innerHTML = '⭐'; // filled star
        } else {
            button.classList.remove('active');
            button.innerHTML = '☆'; // empty star
        }
    }

    /**
     * Update audio control buttons based on qari selection
     * @param {string} qariKey - Selected qari key
     */
    updateAudioButtons(qariKey) {
        const audioButtons = document.querySelectorAll('.ayat-control-btn[title="Putar Audio"]');
        audioButtons.forEach(button => {
            if (qariKey) {
                button.disabled = false;
                button.style.opacity = '1';
            } else {
                button.disabled = true;
                button.style.opacity = '0.5';
            }
        });
    }

    /**
     * Show/hide loading indicator
     * @param {string} elementId - ID of element to show loading
     */
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="loading">Memuat...</div>';
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element && element.innerHTML.includes('loading')) {
            element.innerHTML = '';
        }
    }

    /**
     * Modal management
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            this.currentModal = modalId;
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            if (this.currentModal === modalId) {
                this.currentModal = null;
            }
        }
    }

    /**
     * Show auth modal with specific form
     * @param {string} formType - 'login' or 'register'
     */
    showAuthModal(formType = 'login') {
        this.showModal('auth-modal');
        this.switchAuthForm(formType);
    }

    /**
     * Switch between login and register forms
     * @param {string} formType - 'login' or 'register'
     */
    switchAuthForm(formType) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (formType === 'register') {
            if (loginForm) loginForm.classList.add('hidden');
            if (registerForm) registerForm.classList.remove('hidden');
        } else {
            if (registerForm) registerForm.classList.add('hidden');
            if (loginForm) loginForm.classList.remove('hidden');
        }
    }

    /**
     * Update authentication UI based on user state
     * @param {Object|null} user - Current user object or null
     */
    updateAuthUI(user) {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userGreeting = document.getElementById('user-greeting');

        if (user) {
            // User is logged in
            if (loginBtn) loginBtn.classList.add('hidden');
            if (registerBtn) registerBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            if (userGreeting) {
                userGreeting.classList.remove('hidden');
                userGreeting.textContent = `Halo, ${user.username}`;
            }
        } else {
            // User is not logged in
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (registerBtn) registerBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
            if (userGreeting) userGreeting.classList.add('hidden');
        }
    }

    /**
     * Notification system
     */
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (!notification || !notificationText) return;

        // Clear previous timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        // Set message and type
        notificationText.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');

        // Dispatch custom event
        this.dispatchCustomEvent('notificationShown', { message, type });

        // Auto hide after 5 seconds
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.add('hidden');
        }
        
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = null;
        }
    }

    /**
     * Copy ayat text to clipboard
     * @param {number} ayatNumber - Ayat number to copy
     */
    async copyAyatText(ayatNumber) {
        const ayatElement = document.getElementById(`ayat-${ayatNumber}`);
        if (!ayatElement) return;

        const arabicText = ayatElement.querySelector('.ayat-arabic')?.textContent || '';
        const transliterationText = ayatElement.querySelector('.ayat-transliteration')?.textContent || '';
        const translationText = ayatElement.querySelector('.ayat-translation')?.textContent || '';

        const fullText = `${arabicText}\n\n${transliterationText}\n\n${translationText}`;

        try {
            await navigator.clipboard.writeText(fullText);
            this.showNotification(`Ayat ${ayatNumber} berhasil disalin`, 'success');
        } catch (error) {
            console.error('Failed to copy text:', error);
            this.showNotification('Gagal menyalin teks', 'error');
        }
    }

    /**
     * Scroll to specific ayat
     * @param {number} ayatNumber - Ayat number to scroll to
     */
    scrollToAyat(ayatNumber) {
        const ayatElement = document.getElementById(`ayat-${ayatNumber}`);
        if (ayatElement) {
            ayatElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Highlight the ayat briefly
            ayatElement.style.backgroundColor = 'var(--bg-highlight)';
            setTimeout(() => {
                ayatElement.style.backgroundColor = '';
            }, 2000);
        }
    }

    /**
     * Create and dispatch custom events
     * @param {string} eventName - Name of the event
     * @param {Object} detail - Event detail data
     */
    dispatchCustomEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { 
            bubbles: true, 
            detail 
        });
        document.dispatchEvent(event);
    }

    /**
     * Format numbers to Indonesian locale
     * @param {number} number - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(number) {
        return new Intl.NumberFormat('id-ID').format(number);
    }

    /**
     * Format date to Indonesian locale
     * @param {Date|number} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
        const dateObj = typeof date === 'number' ? new Date(date) : date;
        return dateObj.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Debounce function for search inputs
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @returns {Promise<boolean>} User confirmation result
     */
    async showConfirmation(message) {
        return new Promise((resolve) => {
            if (confirm(message)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    /**
     * Create loading spinner element
     * @returns {HTMLElement} Loading spinner element
     */
    createLoadingSpinner() {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = `
            <div class="spinner"></div>
            <span>Memuat...</span>
        `;
        return spinner;
    }

    /**
     * Animate element entrance
     * @param {HTMLElement} element - Element to animate
     * @param {string} animation - Animation type
     */
    animateIn(element, animation = 'fadeIn') {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 10);
    }

    /**
     * Handle responsive behavior
     */
    handleResponsive() {
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        
        if (window.innerWidth <= 768) {
            if (sidebar) sidebar.classList.add('mobile');
        } else {
            if (sidebar) sidebar.classList.remove('mobile', 'show');
        }
    }

    /**
     * Initialize UI event listeners
     */
    init() {
        // Handle window resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleResponsive();
        }, 250));

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Initialize responsive behavior
        this.handleResponsive();
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Escape key closes modals
        if (e.key === 'Escape' && this.currentModal) {
            this.hideModal(this.currentModal);
        }

        // Ctrl+F focuses search
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input') || 
                              document.getElementById('ayat-search');
            if (searchInput) {
                searchInput.focus();
            }
        }
    }
}

