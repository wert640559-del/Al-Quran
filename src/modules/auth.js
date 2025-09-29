/**
 * AuthManager - Handler untuk sistem authentication sederhana
 * Menggunakan localStorage untuk menyimpan data user
 */
export class AuthManager {
    constructor() {
        this.storageKeys = {
            USERS: 'quran_users',
            CURRENT_USER: 'quran_current_user',
            SESSION: 'quran_session'
        };

        this.initializeAuth();
    }

    /**
     * Initialize authentication system
     */
    initializeAuth() {
        // Initialize users storage if not exists
        if (!this.getStorageItem(this.storageKeys.USERS)) {
            this.setStorageItem(this.storageKeys.USERS, []);
        }

        // Check for existing session
        this.validateSession();
    }

    /**
     * Storage operations with error handling
     */
    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Auth: Error saving ${key}:`, error);
            return false;
        }
    }

    getStorageItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Auth: Error reading ${key}:`, error);
            return null;
        }
    }

    removeStorageItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Auth: Error removing ${key}:`, error);
            return false;
        }
    }

    /**
     * User registration
     * @param {string} username - Username for new user
     * @param {string} password - Password for new user
     * @returns {Object} User object if successful
     * @throws {Error} If registration fails
     */
    register(username, password) {
        // Validation
        if (!username || !password) {
            throw new Error('Username dan password harus diisi');
        }

        if (username.length < 3) {
            throw new Error('Username minimal 3 karakter');
        }

        if (password.length < 6) {
            throw new Error('Password minimal 6 karakter');
        }

        // Check if username already exists
        const users = this.getStorageItem(this.storageKeys.USERS) || [];
        const existingUser = users.find(user => 
            user.username.toLowerCase() === username.toLowerCase()
        );

        if (existingUser) {
            throw new Error('Username sudah digunakan');
        }

        // Create new user
        const newUser = {
            id: this.generateUserId(),
            username: username.trim(),
            password: this.hashPassword(password),
            createdAt: Date.now(),
            lastLogin: null,
            isActive: true,
            profile: {
                displayName: username.trim(),
                preferredQari: '',
                fontSize: 'medium',
                theme: 'light'
            }
        };

        // Save user
        users.push(newUser);
        this.setStorageItem(this.storageKeys.USERS, users);

        // Auto login after registration
        const loginUser = this.createUserSession(newUser);
        
        return loginUser;
    }

    /**
     * User login
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Object} User object if successful
     * @throws {Error} If login fails
     */
    login(username, password) {
        if (!username || !password) {
            throw new Error('Username dan password harus diisi');
        }

        const users = this.getStorageItem(this.storageKeys.USERS) || [];
        const user = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase()
        );

        if (!user) {
            throw new Error('Username tidak ditemukan');
        }

        if (!user.isActive) {
            throw new Error('Akun tidak aktif');
        }

        if (!this.verifyPassword(password, user.password)) {
            throw new Error('Password salah');
        }

        // Update last login
        user.lastLogin = Date.now();
        const userIndex = users.findIndex(u => u.id === user.id);
        users[userIndex] = user;
        this.setStorageItem(this.storageKeys.USERS, users);

        // Create session
        const sessionUser = this.createUserSession(user);
        
        return sessionUser;
    }

    /**
     * User logout
     */
    logout() {
        this.removeStorageItem(this.storageKeys.CURRENT_USER);
        this.removeStorageItem(this.storageKeys.SESSION);
        return true;
    }

    /**
     * Get current logged in user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser() {
        const session = this.getStorageItem(this.storageKeys.SESSION);
        
        if (!session || !this.isSessionValid(session)) {
            this.logout();
            return null;
        }

        return this.getStorageItem(this.storageKeys.CURRENT_USER);
    }

    /**
     * Create user session
     * @param {Object} user - User object
     * @returns {Object} Session user object
     */
    createUserSession(user) {
        const sessionUser = {
            id: user.id,
            username: user.username,
            displayName: user.profile?.displayName || user.username,
            profile: user.profile || {},
            loginTime: Date.now()
        };

        const session = {
            userId: user.id,
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            isValid: true
        };

        this.setStorageItem(this.storageKeys.CURRENT_USER, sessionUser);
        this.setStorageItem(this.storageKeys.SESSION, session);

        return sessionUser;
    }

    /**
     * Validate current session
     */
    validateSession() {
        const session = this.getStorageItem(this.storageKeys.SESSION);
        
        if (!session || !this.isSessionValid(session)) {
            this.logout();
            return false;
        }

        return true;
    }

    /**
     * Check if session is valid
     * @param {Object} session - Session object
     * @returns {boolean} True if session is valid
     */
    isSessionValid(session) {
        if (!session || !session.isValid) {
            return false;
        }

        if (Date.now() > session.expiresAt) {
            return false;
        }

        return true;
    }

    /**
     * Update user profile
     * @param {Object} profileData - Profile data to update
     * @returns {boolean} Success status
     */
    updateProfile(profileData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new Error('User tidak login');
        }

        const users = this.getStorageItem(this.storageKeys.USERS) || [];
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex === -1) {
            throw new Error('User tidak ditemukan');
        }

        // Update user profile
        users[userIndex].profile = {
            ...users[userIndex].profile,
            ...profileData
        };

        // Update current user session
        currentUser.profile = users[userIndex].profile;
        currentUser.displayName = profileData.displayName || currentUser.displayName;

        // Save updates
        this.setStorageItem(this.storageKeys.USERS, users);
        this.setStorageItem(this.storageKeys.CURRENT_USER, currentUser);

        return true;
    }

    /**
     * Change password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {boolean} Success status
     */
    changePassword(currentPassword, newPassword) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new Error('User tidak login');
        }

        if (!currentPassword || !newPassword) {
            throw new Error('Password lama dan baru harus diisi');
        }

        if (newPassword.length < 6) {
            throw new Error('Password baru minimal 6 karakter');
        }

        const users = this.getStorageItem(this.storageKeys.USERS) || [];
        const user = users.find(u => u.id === currentUser.id);
        
        if (!user) {
            throw new Error('User tidak ditemukan');
        }

        if (!this.verifyPassword(currentPassword, user.password)) {
            throw new Error('Password lama salah');
        }

        // Update password
        user.password = this.hashPassword(newPassword);
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        users[userIndex] = user;
        
        this.setStorageItem(this.storageKeys.USERS, users);
        
        return true;
    }

    /**
     * Delete user account
     * @param {string} password - User password for confirmation
     * @returns {boolean} Success status
     */
    deleteAccount(password) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            throw new Error('User tidak login');
        }

        if (!password) {
            throw new Error('Password harus diisi untuk konfirmasi');
        }

        const users = this.getStorageItem(this.storageKeys.USERS) || [];
        const user = users.find(u => u.id === currentUser.id);
        
        if (!user) {
            throw new Error('User tidak ditemukan');
        }

        if (!this.verifyPassword(password, user.password)) {
            throw new Error('Password salah');
        }

        // Remove user from users array
        const updatedUsers = users.filter(u => u.id !== currentUser.id);
        this.setStorageItem(this.storageKeys.USERS, updatedUsers);

        // Logout current user
        this.logout();

        return true;
    }

    /**
     * Get user statistics
     * @returns {Object} User statistics
     */
    getUserStats() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;

        const users = this.getStorageItem(this.storageKeys.USERS) || [];
        const user = users.find(u => u.id === currentUser.id);
        
        if (!user) return null;

        return {
            username: user.username,
            memberSince: new Date(user.createdAt).toLocaleDateString('id-ID'),
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('id-ID') : 'Belum pernah',
            totalDays: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)),
            isActive: user.isActive
        };
    }

    /**
     * Password hashing (simple implementation for demo)
     * In production, use proper hashing like bcrypt
     * @param {string} password - Plain password
     * @returns {string} Hashed password
     */
    hashPassword(password) {
        // This is a simple hash for demo purposes
        // In production, use proper password hashing
        let hash = 0;
        const salt = 'quran_app_salt_2024';
        const combined = password + salt;
        
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return hash.toString();
    }

    /**
     * Verify password
     * @param {string} password - Plain password to verify
     * @param {string} hashedPassword - Stored hashed password
     * @returns {boolean} True if password matches
     */
    verifyPassword(password, hashedPassword) {
        const hash = this.hashPassword(password);
        return hash === hashedPassword;
    }

    /**
     * Generate unique user ID
     * @returns {string} Unique user ID
     */
    generateUserId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `user_${timestamp}_${random}`;
    }

    /**
     * Check if username is available
     * @param {string} username - Username to check
     * @returns {boolean} True if username is available
     */
    isUsernameAvailable(username) {
        const users = this.getStorageItem(this.storageKeys.USERS) || [];
        return !users.some(user => 
            user.username.toLowerCase() === username.toLowerCase()
        );
    }

    /**
     * Get all users (admin function - for demo)
     * @returns {Array} List of users (passwords excluded)
     */
    getAllUsers() {
        const users = this.getStorageItem(this.storageKeys.USERS) || [];
        return users.map(user => ({
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
            isActive: user.isActive,
            profile: user.profile
        }));
    }

    /**
     * Session management
     */
    extendSession() {
        const session = this.getStorageItem(this.storageKeys.SESSION);
        if (session && this.isSessionValid(session)) {
            session.expiresAt = Date.now() + (24 * 60 * 60 * 1000);
            this.setStorageItem(this.storageKeys.SESSION, session);
            return true;
        }
        return false;
    }

    /**
     * Check if user is logged in
     * @returns {boolean} True if user is logged in
     */
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    /**
     * Get user preferences
     * @returns {Object} User preferences
     */
    getUserPreferences() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;

        return {
            theme: currentUser.profile?.theme || 'light',
            fontSize: currentUser.profile?.fontSize || 'medium',
            preferredQari: currentUser.profile?.preferredQari || '',
            displayName: currentUser.profile?.displayName || currentUser.username
        };
    }

    /**
     * Update user preferences
     * @param {Object} preferences - Preferences to update
     * @returns {boolean} Success status
     */
    updateUserPreferences(preferences) {
        try {
            return this.updateProfile(preferences);
        } catch (error) {
            console.error('Error updating preferences:', error);
            return false;
        }
    }

    /**
     * Reset password (demo implementation)
     * In production, this would involve email verification
     * @param {string} username - Username
     * @returns {string} Temporary password
     */
    resetPassword(username) {
        const users = this.getStorageItem(this.storageKeys.USERS) || [];
        const userIndex = users.findIndex(u => 
            u.username.toLowerCase() === username.toLowerCase()
        );

        if (userIndex === -1) {
            throw new Error('Username tidak ditemukan');
        }

        // Generate temporary password
        const tempPassword = this.generateTempPassword();
        users[userIndex].password = this.hashPassword(tempPassword);
        users[userIndex].mustChangePassword = true;
        
        this.setStorageItem(this.storageKeys.USERS, users);

        // In production, send this via email instead of returning
        return tempPassword;
    }

    /**
     * Generate temporary password
     * @returns {string} Temporary password
     */
    generateTempPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Clear all authentication data
     */
    clearAllAuthData() {
        this.removeStorageItem(this.storageKeys.USERS);
        this.removeStorageItem(this.storageKeys.CURRENT_USER);
        this.removeStorageItem(this.storageKeys.SESSION);
        this.initializeAuth();
    }
}