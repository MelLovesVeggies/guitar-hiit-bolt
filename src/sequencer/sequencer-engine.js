class SequencerEngine {
    constructor(audioManager, bassSynthesizer) {
        this.audioManager = audioManager;
        this.bassSynthesizer = bassSynthesizer;
        
        // État du séquenceur
        this.isPlaying = false;
        this.isLooping = true;
        this.currentStep = 0;
        this.tempo = 120; // BPM
        this.stepsPerBeat = 2; // Croches (8th notes)
        this.totalSteps = 8; // 4/4 en croches
        
        // Pattern actuel
        this.currentPattern = ['D', '-', 'D', 'U', '-', 'U', 'D', 'U'];
        this.currentChord = 'E';
        
        // NOUVEAU - Configuration batterie
        this.drumsEnabled = true;
        this.drumVolumes = {
            kick: 0.8,
            snare: 0.7,
            hihat: 0.5
        };

        // NOUVEAU : Volume de la basse
        this.bassVolume = 0.7;
        
        // Timing
        this.nextStepTime = 0;
        this.scheduleAheadTime = 25.0; // 25ms d'avance
        this.lookAhead = 25.0;
        this.stepLength = 0.25; // Durée d'une croche en secondes à 120 BPM
        
        // Timer
        this.timerID = null;
        
        // Callbacks
        this.onStepCallback = null;
        this.onPatternCompleteCallback = null;
        
        this.updateStepLength();
    }

    // Calculer la durée d'un step selon le tempo
    updateStepLength() {
        this.stepLength = 60.0 / (this.tempo * this.stepsPerBeat);
    }

    start() {
        if (!this.audioManager.isReady) {
            console.warn('AudioManager non prêt');
            return false;
        }

        if (this.isPlaying) {
            return true;
        }

        this.isPlaying = true;
        this.currentStep = 0;
        this.nextStepTime = this.audioManager.getCurrentTime();
        
        this.schedule();
        this.timerID = setInterval(() => this.schedule(), this.lookAhead);
        
        console.log('Séquenceur démarré');
        return true;
    }

    stop() {
        if (!this.isPlaying) {
            return;
        }

        this.isPlaying = false;
        this.currentStep = 0;
        
        if (this.timerID) {
            clearInterval(this.timerID);
            this.timerID = null;
        }
        
        this.bassSynthesizer.stopCurrentNote();
        
        console.log('Séquenceur arrêté');
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.resume();
        }
    }

    pause() {
        if (this.isPlaying) {
            this.isPlaying = false;
            if (this.timerID) {
                clearInterval(this.timerID);
                this.timerID = null;
            }
            console.log('Séquenceur en pause');
        }
    }

    resume() {
        if (!this.isPlaying && this.audioManager.isReady) {
            this.isPlaying = true;
            this.nextStepTime = this.audioManager.getCurrentTime();
            this.schedule();
            this.timerID = setInterval(() => this.schedule(), this.lookAhead);
            console.log('Séquenceur repris');
        }
    }

    schedule() {
        const currentTime = this.audioManager.getCurrentTime();
        
        while (this.nextStepTime < currentTime + this.scheduleAheadTime / 1000.0) {
            this.scheduleStep(this.currentStep, this.nextStepTime);
            this.nextStep();
        }
    }

// MÉTHODE MODIFIÉE - Planifier un step avec batterie et nouvelles notes (X, B)
    scheduleStep(stepNumber, time) {
        const stepValue = this.currentPattern[stepNumber];
        
        // Jouer la note de basse si le step est actif ET n'est pas un Chuck (X)
        if (stepValue && stepValue !== '-' && stepValue !== 'X') {
            const bassNote = this.bassSynthesizer.adaptToChord(this.currentChord);
            
            // Si c'est un 'B' (Coup grave), on réduit légèrement le volume du synthétiseur 
            // pour simuler la dynamique par rapport à un vrai 'D'
            const dynamicVolume = (stepValue === 'B') ? (this.bassVolume * 0.7) : this.bassVolume;
            
            this.bassSynthesizer.playNote(bassNote, this.stepLength * 0.7, dynamicVolume, time);
        }

        // Si c'est un Chuck (X), on demande à l'audioManager de jouer le sample 'X'
        // NEW/ Si c'est un Chuck (X)
        if (stepValue === 'X') {
            // ✅ On utilise this.bassVolume pour que le Chuck suive le curseur de la Basse
            // On peut même mettre un petit coefficient (0.8) pour qu'il soit un poil plus doux
            this.audioManager.playDrumSample('chuck', this.bassVolume * 0.8, time); 
        }
        
        // Jouer la batterie automatique
        if (this.drumsEnabled && this.audioManager.drumsReady) {
            this.playAutomaticDrumPattern(stepNumber, stepValue, time);
        }
        
        // Notifier l'UI
        if (this.onStepCallback) {
            setTimeout(() => {
                this.onStepCallback(stepNumber, stepValue, time);
            }, (time - this.audioManager.getCurrentTime()) * 1000);
        }
    }

    // NOUVELLE MÉTHODE - Pattern de batterie automatique
    // NOUVELLE MÉTHODE - Pattern de batterie automatique
    playAutomaticDrumPattern(stepIndex, stepValue, time) {
        // ZERO LATENCE : Plus de setTimeout, on passe "time" !
        if (stepIndex === 0 || stepIndex === 4 || stepIndex === 8 || stepIndex === 12) {
            this.audioManager.playDrumSample('kick', this.drumVolumes.kick, time);
        }
        
        if (stepIndex === 2 || stepIndex === 6 || stepIndex === 10 || stepIndex === 14) {
            this.audioManager.playDrumSample('snare', this.drumVolumes.snare, time);
        }
        
        // MODIFIÉ : Le hihat joue sur TOUTES les frappes (D, U, B, X)
        if (stepValue === 'D' || stepValue === 'U' || stepValue === 'B' || stepValue === 'X') {
            this.audioManager.playDrumSample('hihat', this.drumVolumes.hihat, time);
        }
    }


    nextStep() {
        const secondsPerStep = this.stepLength;
        this.nextStepTime += secondsPerStep;
        
        this.currentStep++;
        
        if (this.currentStep >= this.totalSteps) {
            this.currentStep = 0;
            
            if (this.onPatternCompleteCallback) {
                this.onPatternCompleteCallback();
            }
            
            if (!this.isLooping) {
                this.stop();
            }
        }
    }

    setTempo(newTempo) {
        if (newTempo >= 60 && newTempo <= 200) {
            this.tempo = newTempo;
            this.updateStepLength();
            console.log(`Tempo changé: ${newTempo} BPM`);
        }
    }

    // NOUVELLE FONCTION : Changer la taille de la grille (8 ou 16)
    setGridSize(newSize) {
        // On vérifie qu'on demande bien 8 ou 16 cases
        if (newSize !== 8 && newSize !== 16) return;

        // Si le musicien passe de 8 à 16 cases
        if (newSize === 16 && this.totalSteps === 8) {
            // On lui ajoute 8 silences ('-') à la fin de son rythme actuel
            const silences = ['-', '-', '-', '-', '-', '-', '-', '-'];
            this.currentPattern = [...this.currentPattern, ...silences];
        } 
        // Si le musicien repasse de 16 à 8 cases
        else if (newSize === 8 && this.totalSteps === 16) {
            // On "coupe" la partition pour ne garder que les 8 premières cases
            this.currentPattern = this.currentPattern.slice(0, 8);
        }

        // On met à jour la règle du cerveau
        this.totalSteps = newSize;

        // Sécurité : si la musique jouait la case 12 et qu'on repasse à 8 cases,
        // on remet le lecteur au début pour éviter un bug.
        if (this.currentStep >= this.totalSteps) {
            this.currentStep = 0;
        }

        console.log(`Le séquenceur tourne maintenant sur ${newSize} cases.`);
    }

    // FONCTION MODIFIÉE
    setPattern(newPattern) {
        // On accepte maintenant les tableaux de 8 OU de 16 éléments
        if (Array.isArray(newPattern) && (newPattern.length === 8 || newPattern.length === 16)) {
            
            // Le cerveau s'adapte automatiquement à la taille du pattern reçu !
            this.totalSteps = newPattern.length; 
            
            this.currentPattern = [...newPattern];
            console.log(`Pattern mis à jour (${this.totalSteps} cases) :`, this.currentPattern);
        }
    }

    setStep(stepIndex, value) {
        if (stepIndex >= 0 && stepIndex < this.totalSteps) {
            this.currentPattern[stepIndex] = value;
            console.log(`Step ${stepIndex} mis à jour: ${value}`);
        }
    }

    setChord(chordName) {
        this.currentChord = chordName;
        console.log(`Accord changé: ${chordName}`);
    }

    setLooping(looping) {
        this.isLooping = looping;
        console.log(`Loop ${looping ? 'activé' : 'désactivé'}`);
    }

    // NOUVELLES MÉTHODES - Contrôle batterie
    enableDrums(enabled = true) {
        this.drumsEnabled = enabled;
        console.log(`Batterie ${enabled ? 'activée' : 'désactivée'}`);
    }

    setDrumVolume(drumType, volume) {
        if (this.drumVolumes[drumType] !== undefined) {
            this.drumVolumes[drumType] = Math.max(0, Math.min(1, volume));
            console.log(`Volume ${drumType}: ${this.drumVolumes[drumType]}`);
        }
    }

    getDrumVolume(drumType) {
        return this.drumVolumes[drumType] || 0;
    }

    // NEW 28 février : Fonction pour régler le volume de la basse
    setBassVolume(volume) {
        this.bassVolume = Math.max(0, Math.min(1, volume));
    }

    // Getters
    get isRunning() {
        return this.isPlaying;
    }

    get currentStepIndex() {
        return this.currentStep;
    }

    get pattern() {
        return [...this.currentPattern];
    }

    get bpm() {
        return this.tempo;
    }

    get looping() {
        return this.isLooping;
    }

    onStep(callback) {
        this.onStepCallback = callback;
    }

    onPatternComplete(callback) {
        this.onPatternCompleteCallback = callback;
    }

    chainPatterns(patterns, repetitions = 1) {
        console.log('Chaînage de patterns (à implémenter):', patterns);
    }

    dispose() {
        this.stop();
        this.onStepCallback = null;
        this.onPatternCompleteCallback = null;
    }
}

window.SequencerEngine = SequencerEngine;
