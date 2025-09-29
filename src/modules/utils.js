/**
 * Utils - Helper functions untuk aplikasi Al-Qur'an
 */
export class Utils {
    constructor() {
        this.arabicNumbers = {
            '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
            '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
        };
    }

    /**
     * URL Parameter handling
     */
    getUrlParameter(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    updateUrl(page, params = {}) {
        const url = new URL(page, window.location.origin);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        
        // Update URL without page reload
        window.history.pushState({ page, params }, '', url);
    }

    /**
     * Arabic text utilities
     */
    convertToArabicNumbers(text) {
        return text.replace(/[0-9]/g, (match) => {
            return this.arabicNumbers[match] || match;
        });
    }

    removeArabicDiacritics(arabicText) {
        // Remove common Arabic diacritics for search purposes
        return arabicText.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
    }

    isArabicText(text) {
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
        return arabicRegex.test(text);
    }

    /**
     * Text formatting utilities
     */
    truncateText(text, maxLength = 100, suffix = '...') {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    capitalizeFirst(text) {
        if (!text) return text;
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    formatSuratName(nama, namaLatin) {
        return `${namaLatin} (${nama})`;
    }

    /**
     * Number formatting utilities
     */
    formatNumber(number, locale = 'id-ID') {
        return new Intl.NumberFormat(locale).format(number);
    }

    padNumber(number, length = 3) {
        return String(number).padStart(length, '0');
    }

    /**
     * Date and time utilities
     */
    formatDate(timestamp, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            locale: 'id-ID'
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        const date = new Date(timestamp);
        
        return date.toLocaleDateString(finalOptions.locale, {
            year: finalOptions.year,
            month: finalOptions.month,
            day: finalOptions.day,
            hour: finalOptions.hour,
            minute: finalOptions.minute
        });
    }

    formatRelativeTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minute = 60 * 1000;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;
        const month = day * 30;
        
        if (diff < minute) {
            return 'Baru saja';
        } else if (diff < hour) {
            const minutes = Math.floor(diff / minute);
            return `${minutes} menit yang lalu`;
        } else if (diff < day) {
            const hours = Math.floor(diff / hour);
            return `${hours} jam yang lalu`;
        } else if (diff < week) {
            const days = Math.floor(diff / day);
            return `${days} hari yang lalu`;
        } else if (diff < month) {
            const weeks = Math.floor(diff / week);
            return `${weeks} minggu yang lalu`;
        } else {
            const months = Math.floor(diff / month);
            return `${months} bulan yang lalu`;
        }
    }

    getIslamicTime() {
        // Simple implementation - in production, use proper Islamic calendar library
        const now = new Date();
        const islamicEpoch = new Date(622, 6, 16); // Approximate
        const diffInDays = Math.floor((now - islamicEpoch) / (1000 * 60 * 60 * 24));
        const islamicYear = Math.floor(diffInDays / 354) + 1; // Approximate
        
        return {
            year: islamicYear,
            date: now
        };
    }

    /**
     * Search and filter utilities
     */
    createSearchRegex(query, options = {}) {
        const defaultOptions = {
            caseSensitive: false,
            wholeWord: false,
            diacriticsInsensitive: true
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        let pattern = query;
        
        if (finalOptions.diacriticsInsensitive && this.isArabicText(query)) {
            pattern = this.removeArabicDiacritics(pattern);
        }
        
        if (finalOptions.wholeWord) {
            pattern = `\\b${pattern}\\b`;
        }
        
        const flags = finalOptions.caseSensitive ? 'g' : 'gi';
        
        return new RegExp(pattern, flags);
    }

    highlightText(text, query, className = 'highlight') {
        if (!query || !text) return text;
        
        const regex = this.createSearchRegex(query);
        return text.replace(regex, `<span class="${className}">$&</span>`);
    }

    /**
     * Audio utilities
     */
    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Validation utilities
     */
    isValidSuratNumber(number) {
        const num = parseInt(number);
        return !isNaN(num) && num >= 1 && num <= 114;
    }

    isValidAyatNumber(number, maxAyat) {
        const num = parseInt(number);
        return !isNaN(num) && num >= 1 && num <= maxAyat;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUsername(username) {
        // Username should be 3-20 characters, alphanumeric and underscore only
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    }

    isValidPassword(password) {
        // Password should be at least 6 characters
        return password && password.length >= 6;
    }

    /**
     * Storage utilities
     */
    getStorageSize(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? new Blob([item]).size : 0;
        } catch (error) {
            return 0;
        }
    }

    getTotalStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += this.getStorageSize(key);
            }
        }
        return total;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Array utilities
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getRandomItem(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    }

    groupBy(array, keyFn) {
        return array.reduce((groups, item) => {
            const key = keyFn(item);
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    }

    sortBy(array, keyFn, ascending = true) {
        const sorted = [...array].sort((a, b) => {
            const aVal = keyFn(a);
            const bVal = keyFn(b);
            
            if (aVal < bVal) return ascending ? -1 : 1;
            if (aVal > bVal) return ascending ? 1 : -1;
            return 0;
        });
        
        return sorted;
    }

    /**
     * Debounce utility
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * Throttle utility
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Color utilities
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Device detection utilities
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    isTablet() {
        return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    }

    isDesktop() {
        return !this.isMobile() && !this.isTablet();
    }

    getDeviceType() {
        if (this.isMobile()) return 'mobile';
        if (this.isTablet()) return 'tablet';
        return 'desktop';
    }

    /**
     * Network utilities
     */
    isOnline() {
        return navigator.onLine;
    }

    getConnectionType() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return connection ? connection.effectiveType : 'unknown';
    }

    /**
     * Performance utilities
     */
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    async measureAsyncPerformance(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    /**
     * Error handling utilities
     */
    createError(message, code, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        error.timestamp = Date.now();
        return error;
    }

    logError(error, context = '') {
        console.error(`[Error${context ? ' - ' + context : ''}]:`, {
            message: error.message,
            code: error.code,
            details: error.details,
            stack: error.stack,
            timestamp: error.timestamp || Date.now()
        });
    }

    /**
     * Cookie utilities (if needed for future features)
     */
    setCookie(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    /**
     * QR Code generation utility (simple implementation)
     */
    generateQRData(text) {
        // This would typically use a QR code library
        // For now, return a placeholder
        return {
            text: text,
            url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`,
            size: '200x200'
        };
    }

    /**
     * Share utilities
     */
    async shareContent(data) {
        if (navigator.share) {
            try {
                await navigator.share(data);
                return true;
            } catch (error) {
                console.log('Error sharing:', error);
                return false;
            }
        } else {
            // Fallback to copying to clipboard
            if (data.text) {
                return this.copyToClipboard(data.text);
            }
            return false;
        }
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback method
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (fallbackError) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    /**
     * Print utilities
     */
    printElement(elementId, title = 'Al-Qur\'an Print') {
        const element = document.getElementById(elementId);
        if (!element) return false;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .ayat-arabic { font-size: 18px; line-height: 2; text-align: right; margin: 10px 0; }
                        .ayat-translation { margin: 10px 0; line-height: 1.6; }
                        .ayat-number { font-weight: bold; margin: 10px 0; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    ${element.innerHTML}
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        return true;
    }

    /**
     * Animation utilities
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress.toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    fadeOut(element, duration = 300) {
        const start = performance.now();
        const initialOpacity = parseFloat(getComputedStyle(element).opacity);
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = (initialOpacity * (1 - progress)).toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    }

    slideUp(element, duration = 300) {
        const initialHeight = element.offsetHeight;
        element.style.height = initialHeight + 'px';
        element.style.overflow = 'hidden';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.height = (initialHeight * (1 - progress)) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
            }
        }
        
        requestAnimationFrame(animate);
    }

    slideDown(element, duration = 300) {
        element.style.display = 'block';
        const targetHeight = element.scrollHeight;
        element.style.height = '0px';
        element.style.overflow = 'hidden';
        
        const start = performance.now();
        
        function animate(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.height = (targetHeight * progress) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.height = '';
                element.style.overflow = '';
            }
        }
        
        requestAnimationFrame(animate);
    }

    /**
     * Islamic utilities
     */
    getQiblaDirection(latitude, longitude) {
        // Kaaba coordinates
        const kaabaLat = 21.4225;
        const kaabaLng = 39.8262;
        
        const lat1 = latitude * Math.PI / 180;
        const lat2 = kaabaLat * Math.PI / 180;
        const deltaLng = (kaabaLng - longitude) * Math.PI / 180;
        
        const x = Math.sin(deltaLng) * Math.cos(lat2);
        const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
        
        let bearing = Math.atan2(x, y) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;
        
        return bearing;
    }

    getIslamicMonths() {
        return [
            'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
            'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
            'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
        ];
    }

    /**
     * Random Islamic quotes/verses for daily inspiration
     */
    getRandomInspiration() {
        const inspirations = [
            {
                arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
                translation: 'Dan barang siapa yang bertakwa kepada Allah niscaya Dia akan mengadakan baginya jalan keluar.',
                source: 'QS. At-Talaq: 2'
            },
            {
                arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
                translation: 'Sesungguhnya sesudah kesulitan itu ada kemudahan.',
                source: 'QS. Ash-Sharh: 6'
            },
            {
                arabic: 'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ',
                translation: 'Dan janganlah kamu berputus asa dari rahmat Allah.',
                source: 'QS. Yusuf: 87'
            }
        ];
        
        return this.getRandomItem(inspirations);
    }

    /**
     * Export utilities
     */
    downloadAsJSON(data, filename = 'quran-data.json') {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    downloadAsText(text, filename = 'quran-text.txt') {
        const blob = new Blob([text], { type: 'text/plain' });
        this.downloadBlob(blob, filename);
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Initialize utility functions
     */
    init() {
        // Setup global error handler
        window.addEventListener('error', (event) => {
            this.logError(event.error, 'Global Error Handler');
        });

        // Setup unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.logError(event.reason, 'Unhandled Promise Rejection');
        });

        // Setup online/offline handlers
        window.addEventListener('online', () => {
            console.log('App is online');
        });

        window.addEventListener('offline', () => {
            console.log('App is offline');
        });
    }
}