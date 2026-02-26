class EasyStrumApp {
    constructor() {
        this.audioManager = null;
        this.bassSynthesizer = null;
        this.sequencerEngine = null;
        this.patternLibrary = null;
        this.presetManager = null;
        this.storageManager = null;
        this.uiSequencer = null;
        
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initialisation d\'EasyStrum...');
            
            // Initialiser les modules dans l'ordre
            await this.initAudio();
            this.initLibraries();
            await this.initSequencer();
            this.initUI();
            
            this.isInitialized = true;
            console.log('EasyStrum initialisé avec succès !');
            
            // Afficher les informations de débogage
            this.showDebugInfo();
            
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            this.showError('Erreur lors de l\'initialisation de l\'application');
        }
    }

    async initAudio() {
    console.log('Initialisation de l\'audio...');
    
    // Créer le gestionnaire audio SANS créer l'AudioContext
    this.audioManager = window.audioManager;
    const success = await this.audioManager.initialize();
    
    if (!success) {
        throw new Error('Impossible d\'initialiser l\'audio');
    }

    // Créer le synthétiseur de basse (qui ne chargera pas les échantillons tout de suite)
    this.bassSynthesizer = new BassSynthesizer(this.audioManager);
    
    console.log('Audio pré-initialisé (en attente d\'interaction utilisateur)');
}

    initLibraries() {
        console.log('Initialisation des bibliothèques...');
        
        // Créer les bibliothèques de données
        this.patternLibrary = new PatternLibrary();
        this.presetManager = new PresetManager();
        this.storageManager = new StorageManager();
        
        console.log('Bibliothèques initialisées');
    }

    async initSequencer() {
        console.log('Initialisation du séquenceur...');
        
        // Attendre que les échantillons soient prêts (ou timeout après 15 secondes)
        let attempts = 0;
        const maxAttempts = 30; // 30 * 500ms = 15 secondes
        
        while (!this.bassSynthesizer.isReady() && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        if (!this.bassSynthesizer.isReady()) {
            console.warn('Séquenceur initialisé sans tous les échantillons de basse');
        }
        
        // Créer le moteur de séquençage
        this.sequencerEngine = new SequencerEngine(
            this.audioManager,
            this.bassSynthesizer
        );
        
        console.log('Séquenceur initialisé');
    }

initUI() {
    console.log('Initialisation de l\'interface...');
    
    // Créer l'interface utilisateur
    this.uiSequencer = new UISequencer(
        this.sequencerEngine,
        this.patternLibrary,
        this.presetManager,
        this.storageManager
    );
    
    // Bind les événements globaux
    this.bindGlobalEvents();
    
    // NOUVEAU - Initialiser les contrôles batterie
    this.initDrumsControls();
    
    console.log('Interface initialisée');
}


    bindGlobalEvents() {
        // Gestion de la fermeture de l'onglet
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Gestion des erreurs globales
        window.addEventListener('error', (event) => {
            console.error('Erreur globale:', event.error);
            this.showError('Une erreur inattendue s\'est produite');
        });

        // Gestion des promesses rejetées
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesse rejetée:', event.reason);
            event.preventDefault();
        });

        // Gestion de la visibilité de la page
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page cachée - mettre en pause si nécessaire
                if (this.sequencerEngine && this.sequencerEngine.isRunning) {
                    console.log('Page cachée - pause automatique');
                }
            } else {
                // Page visible - reprendre le contexte audio si nécessaire
                if (this.audioManager) {
                    this.audioManager.resumeContext();
                }
            }
        });

        // Activation de l'audio au premier clic utilisateur
        document.addEventListener('click', this.handleFirstUserInteraction.bind(this), { once: true });
        document.addEventListener('touchstart', this.handleFirstUserInteraction.bind(this), { once: true });
    }

    // NOUVELLE MÉTHODE - Ajoutez après bindGlobalEvents() et avant handleFirstUserInteraction()
initDrumsControls() {
    console.log('Initialisation des contrôles batterie...');
    
    // Toggle batterie
    const drumsToggle = document.getElementById('drums-enabled');
    if (drumsToggle) {
        drumsToggle.addEventListener('change', (e) => {
            if (this.sequencerEngine) {
                this.sequencerEngine.enableDrums(e.target.checked);
            }
        });
    }
    
    // Volume grosse caisse
    const kickVolume = document.getElementById('kick-volume');
    if (kickVolume) {
        kickVolume.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            if (this.sequencerEngine) {
                this.sequencerEngine.setDrumVolume('kick', volume);
            }
            const valueSpan = e.target.nextElementSibling;
            if (valueSpan) valueSpan.textContent = `${e.target.value}%`;
        });
    }
    
    // Volume caisse claire
    const snareVolume = document.getElementById('snare-volume');
    if (snareVolume) {
        snareVolume.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            if (this.sequencerEngine) {
                this.sequencerEngine.setDrumVolume('snare', volume);
            }
            const valueSpan = e.target.nextElementSibling;
            if (valueSpan) valueSpan.textContent = `${e.target.value}%`;
        });
    }
    
    // Volume charleston
    const hihatVolume = document.getElementById('hihat-volume');
    if (hihatVolume) {
        hihatVolume.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            if (this.sequencerEngine) {
                this.sequencerEngine.setDrumVolume('hihat', volume);
            }
            const valueSpan = e.target.nextElementSibling;
            if (valueSpan) valueSpan.textContent = `${e.target.value}%`;
        });
    }
    
    console.log('Contrôles batterie initialisés');
}


    async handleFirstUserInteraction() {
    console.log('Première interaction utilisateur détectée');
    
    if (this.audioManager && !this.audioManager.isReady) {
        // Créer l'AudioContext maintenant
        const success = await this.audioManager.createAudioContextOnUserGesture();
        
        if (success) {
            console.log('AudioContext activé, chargement des échantillons...');
            
            // Maintenant charger les échantillons de basse
            await this.bassSynthesizer.loadAllSamples();
            
            // Afficher le statut
            const status = this.bassSynthesizer.getLoadingStatus();
            if (status.loaded > 0) {
                this.showInfo(`${status.loaded}/${status.total} échantillons de basse chargés !`);
            } else {
                this.showError('Impossible de charger les échantillons de basse');
            }
        } else {
            this.showError('Impossible d\'activer l\'audio');
        }
    }
}

    // Méthodes utilitaires
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // Supprimer après 5 secondes
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    showInfo(message) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'info-message';
        infoDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4ecdc4;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
        `;
        infoDiv.textContent = message;
        
        document.body.appendChild(infoDiv);
        
        // Supprimer après 3 secondes
        setTimeout(() => {
            if (infoDiv.parentNode) {
                infoDiv.parentNode.removeChild(infoDiv);
            }
        }, 3000);
    }

    showDebugInfo() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('=== EasyStrum Debug Info ===');
            console.log('Audio Manager:', this.audioManager.state);
            console.log('Bass Synthesizer Ready:', this.bassSynthesizer.isReady());
            
            if (this.bassSynthesizer.isReady()) {
                const status = this.bassSynthesizer.getLoadingStatus();
                console.log('Échantillons de basse:', `${status.loaded}/${status.total}`);
            }
            
            console.log('Patterns disponibles:', this.patternLibrary.getAllPatterns().length);
            console.log('Presets disponibles:', this.presetManager.getAllPresets().length);
            console.log('Patterns sauvegardés:', this.storageManager.getSavedPatterns().length);
            console.log('Séquenceur:', this.sequencerEngine.isRunning ? 'En cours' : 'Arrêté');
            console.log('============================');
        }
    }

    // API publique pour l'utilisation externe
    getStats() {
        if (!this.isInitialized) return null;

        return {
            audio: {
                state: this.audioManager.state,
                volume: this.audioManager.getMasterVolume()
            },
            bass: {
                ready: this.bassSynthesizer.isReady(),
                samples: this.bassSynthesizer.getLoadingStatus()
            },
            sequencer: {
                isPlaying: this.sequencerEngine.isRunning,
                bpm: this.sequencerEngine.bpm,
                pattern: this.sequencerEngine.pattern,
                looping: this.sequencerEngine.looping
            },
            library: {
                patterns: this.patternLibrary.getStats(),
                presets: this.presetManager.getStats(),
                storage: this.storageManager.getUsageStats()
            }
        };
    }

    // Méthodes de contrôle pour l'API externe
    play() {
        if (this.sequencerEngine && !this.sequencerEngine.isRunning) {
            if (!this.bassSynthesizer.isReady()) {
                this.showError('Les échantillons de basse ne sont pas encore prêts');
                return;
            }
            this.sequencerEngine.start();
            this.uiSequencer.updateTransportUI();
        }
    }

    pause() {
        if (this.sequencerEngine && this.sequencerEngine.isRunning) {
            this.sequencerEngine.pause();
            this.uiSequencer.updateTransportUI();
        }
    }

    stop() {
        if (this.sequencerEngine && this.sequencerEngine.isRunning) {
            this.sequencerEngine.stop();
            this.uiSequencer.updateTransportUI();
        }
    }

    setTempo(bpm) {
        if (this.sequencerEngine && bpm >= 60 && bpm <= 200) {
            this.sequencerEngine.setTempo(bpm);
            this.uiSequencer.updateTempoDisplay();
        }
    }

    setPattern(pattern) {
        if (this.sequencerEngine && Array.isArray(pattern) && pattern.length === 8) {
            this.sequencerEngine.setPattern(pattern);
            this.uiSequencer.updateSequencerGrid();
        }
    }

    loadPreset(presetId) {
        if (this.uiSequencer) {
            this.uiSequencer.selectSong(presetId);
        }
    }

    // Gestion du volume
    setVolume(volume) {
        if (this.audioManager && volume >= 0 && volume <= 1) {
            this.audioManager.setMasterVolume(volume);
            this.storageManager.setSetting('volume', volume);
        }
    }

    getVolume() {
        return this.audioManager ? this.audioManager.getMasterVolume() : 0;
    }

    // Gestion des paramètres
    saveSetting(key, value) {
        if (this.storageManager) {
            this.storageManager.setSetting(key, value);
        }
    }

    getSetting(key, defaultValue = null) {
        return this.storageManager ? this.storageManager.getSetting(key, defaultValue) : defaultValue;
    }

    // Export/Import des données
    exportAllData() {
        if (this.storageManager) {
            return this.storageManager.exportAllData();
        }
        return null;
    }

    importData(jsonString) {
        if (this.storageManager) {
            const result = this.storageManager.importData(jsonString);
            if (result > 0) {
                this.uiSequencer.loadUserPatterns();
                this.showInfo(`${result} éléments importés avec succès`);
            }
            return result;
        }
        return 0;
    }

    // Gestion des favoris
    addToFavorites(type, id) {
        if (this.storageManager) {
            const success = this.storageManager.addToFavorites(type, id);
            if (success) {
                this.showInfo('Ajouté aux favoris');
            }
            return success;
        }
        return false;
    }

    removeFromFavorites(type, id) {
        if (this.storageManager) {
            const success = this.storageManager.removeFromFavorites(type, id);
            if (success) {
                this.showInfo('Retiré des favoris');
            }
            return success;
        }
        return false;
    }

    // Test des fonctionnalités
    testAudio() {
        if (this.bassSynthesizer && this.bassSynthesizer.isReady()) {
            console.log('Test audio - Note de basse E');
            this.bassSynthesizer.playNote('E', 1.0, 0.8);
            return true;
        } else {
            console.warn('Test audio - Échantillons de basse non prêts');
            return false;
        }
    }

    testPattern() {
        if (this.sequencerEngine) {
            console.log('Test pattern - Pattern de démonstration');
            const testPattern = ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'];
            this.setPattern(testPattern);
            return true;
        }
        return false;
    }

    // NOUVELLES MÉTHODES - API batterie
testDrums() {
    if (this.audioManager && this.audioManager.drumsReady) {
        console.log('Test batterie...');
        setTimeout(() => this.audioManager.playDrumSample('kick', 0.8), 0);
        setTimeout(() => this.audioManager.playDrumSample('snare', 0.7), 200);
        setTimeout(() => this.audioManager.playDrumSample('hihat', 0.5), 400);
        return true;
    } else {
        console.warn('Échantillons de batterie non prêts');
        return false;
    }
}

enableDrums(enabled = true) {
    if (this.sequencerEngine) {
        this.sequencerEngine.enableDrums(enabled);
        return true;
    }
    return false;
}

setDrumVolume(drumType, volume) {
    if (this.sequencerEngine && volume >= 0 && volume <= 1) {
        this.sequencerEngine.setDrumVolume(drumType, volume);
        return true;
    }
    return false;
}

getDrumVolume(drumType) {
    return this.sequencerEngine ? this.sequencerEngine.getDrumVolume(drumType) : 0;
}


    // Forcer le rechargement des échantillons
    async reloadSamples() {
        if (this.bassSynthesizer) {
            console.log('Rechargement des échantillons de basse...');
            await this.bassSynthesizer.loadAllSamples();
            const status = this.bassSynthesizer.getLoadingStatus();
            this.showInfo(`${status.loaded}/${status.total} échantillons rechargés`);
        }
    }

    // Obtenir les informations sur les échantillons
    getSampleInfo() {
        if (this.bassSynthesizer) {
            return this.bassSynthesizer.getLoadingStatus();
        }
        return { loaded: 0, total: 0, isComplete: false };
    }

    // Nettoyage des ressources
    cleanup() {
        console.log('Nettoyage des ressources...');
        
        if (this.uiSequencer) {
            this.uiSequencer.dispose();
            this.uiSequencer = null;
        }
        
        if (this.sequencerEngine) {
            this.sequencerEngine.dispose();
            this.sequencerEngine = null;
        }
        
        if (this.bassSynthesizer) {
            this.bassSynthesizer.dispose();
            this.bassSynthesizer = null;
        }
        
        if (this.audioManager) {
            this.audioManager.dispose();
            this.audioManager = null;
        }
        
        this.isInitialized = false;
        console.log('EasyStrum nettoyé avec succès');
    }
}

// Instance globale de l'application
let app;

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM chargé, initialisation d\'EasyStrum...');
    
    try {
        app = new EasyStrumApp();
        
        // Exposer l'app globalement pour le débogage
        window.app = app;
        
        // Message de bienvenue après initialisation
        setTimeout(() => {
            if (app.isInitialized) {
                console.log('🎸 EasyStrum prêt à l\'utilisation !');
                
                // Test automatique des échantillons au démarrage
                if (app.bassSynthesizer && app.bassSynthesizer.isReady()) {
                    console.log('🔊 Échantillons de basse opérationnels');
                }
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff6b6b;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 10000;
            max-width: 400px;
        `;
        errorMessage.innerHTML = `
            <h3>Erreur d'initialisation</h3>
            <p>Impossible de démarrer EasyStrum.</p>
            <p>Vérifiez que :</p>
            <ul style="text-align: left; margin: 10px 0;">
                <li>Votre navigateur supporte Web Audio API</li>
                <li>Les fichiers audio sont présents dans assets/</li>
                <li>Les fichiers sont nommés correctement (Abassnote.wav, etc.)</li>
            </ul>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">Recharger</button>
        `;
        document.body.appendChild(errorMessage);
    }
});

// Nettoyage à la fermeture
window.addEventListener('beforeunload', () => {
    if (app && app.isInitialized) {
        app.cleanup();
    }
});

// Gestion des erreurs globales
window.addEventListener('error', (event) => {
    console.error('Erreur JavaScript:', event.error);
    if (app) {
        app.showError('Une erreur inattendue s\'est produite');
    }
});

// API utilitaire pour les développeurs
window.EasyStrumAPI = {
    getApp: () => app,
    getStats: () => app ? app.getStats() : null,
    testAudio: () => app ? app.testAudio() : false,
    testPattern: () => app ? app.testPattern() : false,
    exportData: () => app ? app.exportAllData() : null,
    importData: (data) => app ? app.importData(data) : 0,
    reloadSamples: () => app ? app.reloadSamples() : null,
    getSampleInfo: () => app ? app.getSampleInfo() : null
};

// API utilitaire pour les développeurs - MISE À JOUR
window.EasyStrumAPI = {
    getApp: () => app,
    getStats: () => app ? app.getStats() : null,
    testAudio: () => app ? app.testAudio() : false,
    testPattern: () => app ? app.testPattern() : false,
    // NOUVEAU - Tests batterie
    testDrums: () => app ? app.testDrums() : false,
    enableDrums: (enabled) => app ? app.enableDrums(enabled) : false,
    setDrumVolume: (type, volume) => app ? app.setDrumVolume(type, volume) : false,
    getDrumVolume: (type) => app ? app.getDrumVolume(type) : 0,
    // Existant
    exportData: () => app ? app.exportAllData() : null,
    importData: (data) => app ? app.importData(data) : 0,
    reloadSamples: () => app ? app.reloadSamples() : null,
    getSampleInfo: () => app ? app.getSampleInfo() : null
};
