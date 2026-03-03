class UISequencer {
    constructor(sequencerEngine, patternLibrary, presetManager, storageManager) {
        this.sequencerEngine = sequencerEngine;
        this.patternLibrary = patternLibrary;
        this.presetManager = presetManager;
        this.storageManager = storageManager;
        
        this.currentPattern = null;
        this.currentPreset = null;
        
        this.initializeUI();
        this.bindEvents();
        this.loadInitialData();
    }

    checkOrientationForAction() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobile = window.innerWidth < 900;
    const overlay = document.getElementById('orientation-overlay');

    if (isMobile && isPortrait) {
        // On affiche le rideau seulement quelques secondes pour avertir
        overlay.style.display = 'flex';
        
        // Optionnel : On le cache automatiquement après 3 secondes 
        // ou on attend que l'utilisateur tourne le téléphone
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 3000);
        
        return false; // Bloque l'action si besoin
    }
    return true;
}

    // Initialiser l'interface utilisateur
    initializeUI() {
        this.createSequencerGrid();
        this.loadPresets();
        this.loadUserPatterns();
        this.updateTransportUI();
        this.updateTempoDisplay();

        // 💾 CHARGEMENT DES VOLUMES SAUVEGARDÉS (Lignes modifiées)
        const savedBass = localStorage.getItem('user-bass-volume') || 70;
        this.syncBassVolume(savedBass);

        const savedDrum = localStorage.getItem('user-drum-volume') || 80;
        this.syncDrumVolume(savedDrum);
    }

    // --- MÉTHODES DE SYNCHRONISATION DES VOLUMES (Ajoutées ici) ---

    syncBassVolume(value) {
        const volPercent = parseInt(value);
        const volDecimal = volPercent / 100;

        // Mise à jour du cerveau
        this.sequencerEngine.setBassVolume(volDecimal);

        // Mise à jour visuelle des curseurs
        const grosSlider = document.getElementById('bass-volume');
        const miniSlider = document.getElementById('master-bass-vol');
        if (grosSlider) grosSlider.value = volPercent;
        if (miniSlider) miniSlider.value = volPercent;

        // Mise à jour du chiffre
        const displaySpan = document.querySelector('.volume-percentage') || 
                            (grosSlider ? grosSlider.nextElementSibling : null);
        if (displaySpan) {
            displaySpan.textContent = `${volPercent}%`;
        }

        // 💾 SAUVEGARDE
        localStorage.setItem('user-bass-volume', value);
    }

    syncDrumVolume(value) {
        const volPercent = parseInt(value);
        const volDecimal = volPercent / 100;

        // Mise à jour du cerveau
        this.sequencerEngine.setDrumVolume('kick', volDecimal);
        this.sequencerEngine.setDrumVolume('snare', volDecimal * 0.9); 
        this.sequencerEngine.setDrumVolume('hihat', volDecimal * 0.6); 
        this.sequencerEngine.setDrumVolume('X', volDecimal * 0.8);

        // Mise à jour visuelle du curseur (mini)
        const miniSlider = document.getElementById('master-drum-vol');
        if (miniSlider) miniSlider.value = volPercent;

        // 💾 SAUVEGARDE
        localStorage.setItem('user-drum-volume', value);
    }

    //MODIFS 01/03 ICI ---
    createSequencerGrid() {
        const grid = document.getElementById('sequencer-grid');
        const beatNumbersContainer = document.getElementById('beat-numbers-container');
        const measureLabelsContainer = document.getElementById('measure-labels-container'); // NOUVEAU
        
        if (grid) grid.innerHTML = '';
        if (beatNumbersContainer) beatNumbersContainer.innerHTML = '';
        if (measureLabelsContainer) measureLabelsContainer.innerHTML = '';

        const totalSteps = this.sequencerEngine.totalSteps; 

        // 1. Générer les étiquettes "Mesure 1 / Mesure 2"
        if (measureLabelsContainer) {
            const measure1 = document.createElement('div');
            measure1.className = 'measure-label';
            measure1.textContent = 'Mesure 1';
            measureLabelsContainer.appendChild(measure1);

            if (totalSteps === 16) {
                const measure2 = document.createElement('div');
                measure2.className = 'measure-label';
                measure2.textContent = 'Mesure 2';
                measureLabelsContainer.appendChild(measure2);
            }
        }

        // 2. Générer les numéros et les cases
        for (let i = 0; i < totalSteps; i++) {
            
            // --- Création du numéro ---
            if (beatNumbersContainer) {
                const beatDiv = document.createElement('div');
                beatDiv.className = 'beat-number';
                if (i % 2 === 0) {
                    beatDiv.textContent = Math.floor((i % 8) / 2) + 1; 
                } else {
                    beatDiv.textContent = '+';
                }
                beatNumbersContainer.appendChild(beatDiv);
            }

            // --- Création du bouton ---
            const stepBtn = document.createElement('button');
            stepBtn.className = 'step-btn empty';
            stepBtn.dataset.step = i;
            stepBtn.innerHTML = `
                <div class="step-content">
                    <div class="step-icon">-</div>
                    <div class="step-label">silence</div>
                </div>
            `;
            stepBtn.addEventListener('click', () => this.toggleStep(i));
            if (grid) grid.appendChild(stepBtn);

            // --- 🚧 LE SÉPARATEUR DE MESURE ---
            if (i === 7 && totalSteps === 16) {
                if (beatNumbersContainer) {
                    const beatDivider = document.createElement('div');
                    beatDivider.className = 'measure-divider ghost';
                    beatNumbersContainer.appendChild(beatDivider);
                }
                if (grid) {
                    const gridDivider = document.createElement('div');
                    gridDivider.className = 'measure-divider visible';
                    grid.appendChild(gridDivider);
                }
            }
        }

        const btn8 = document.getElementById('btn-8-steps');
        const btn16 = document.getElementById('btn-16-steps');
        
        if (btn8 && btn16) {
            if (totalSteps === 16) {
                btn16.classList.add('active');
                btn16.style.backgroundColor = 'var(--primary-color)';
                btn16.style.color = 'white';
                
                btn8.classList.remove('active');
                btn8.style.backgroundColor = 'var(--gray-200)';
                btn8.style.color = 'var(--dark-color)';
            } else {
                btn8.classList.add('active');
                btn8.style.backgroundColor = 'var(--primary-color)';
                btn8.style.color = 'white';
                
                btn16.classList.remove('active');
                btn16.style.backgroundColor = 'var(--gray-200)';
                btn16.style.color = 'var(--dark-color)';
            }
        }
        
        this.updateSequencerGrid();
    }

    toggleStep(stepIndex) {
    // 💡 Si l'utilisateur essaie de coder en portrait, on lui rappelle de tourner
    this.checkOrientationForAction();
        const currentPattern = this.sequencerEngine.pattern;
        const currentValue = currentPattern[stepIndex];
        const isOffbeat = stepIndex % 2 === 1;
        
        let newValue;
        
        if (isOffbeat) {
            switch (currentValue) {
                case '-': newValue = 'U'; break;
                case 'U': newValue = 'X'; break;
                case 'X': newValue = '-'; break;
                default:  newValue = '-';
            }
        } else {
            switch (currentValue) {
                case '-': newValue = 'D'; break;
                case 'D': newValue = 'B'; break;
                case 'B': newValue = 'X'; break;
                case 'X': newValue = '-'; break;
                default:  newValue = '-';
            }
        }

        this.sequencerEngine.setStep(stepIndex, newValue);
        this.updateSequencerGrid();
        
        const stepBtn = document.querySelector(`button[data-step="${stepIndex}"]`);
        stepBtn.classList.add('pulse');
        setTimeout(() => stepBtn.classList.remove('pulse'), 300);
    }

    createBassSynth() {
        const bassSynth = new BassSynthesizer(this.audioManager);
        return bassSynth;
    }

    createPunchCompressor() {
        const compressor = this.audioManager.audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, this.audioManager.getCurrentTime());
        compressor.knee.setValueAtTime(30, this.audioManager.getCurrentTime());
        compressor.ratio.setValueAtTime(8, this.audioManager.getCurrentTime());
        compressor.attack.setValueAtTime(0.003, this.audioManager.getCurrentTime());
        compressor.release.setValueAtTime(0.25, this.audioManager.getCurrentTime());
        return compressor;
    }

    updateSequencerGrid() {
        const grid = document.getElementById('sequencer-grid');
        const currentPattern = this.sequencerEngine.pattern;

        for (let i = 0; i < this.sequencerEngine.totalSteps; i++) {
            const stepBtn = grid.querySelector(`button[data-step="${i}"]`);
            const stepValue = currentPattern[i];

            if (!stepBtn) continue;

            stepBtn.classList.remove('down', 'up', 'empty', 'active', 'dead', 'bass');

            if (stepValue === 'D') {
                stepBtn.classList.add('down');
                stepBtn.querySelector('.step-icon').textContent = '⬇';
                stepBtn.querySelector('.step-label').textContent = 'down';
            } else if (stepValue === 'B') {
                stepBtn.classList.add('bass');
                stepBtn.querySelector('.step-icon').textContent = '⬇';
                stepBtn.querySelector('.step-label').textContent = 'basse';
            } else if (stepValue === 'U') {
                stepBtn.classList.add('up');
                stepBtn.querySelector('.step-icon').textContent = '⬆';
                stepBtn.querySelector('.step-label').textContent = 'up';
            } else if (stepValue === 'X') {
                stepBtn.classList.add('dead');
                stepBtn.querySelector('.step-icon').textContent = '✖';
                stepBtn.querySelector('.step-label').textContent = 'Chuck';
            } else {
                stepBtn.classList.add('empty');
                stepBtn.querySelector('.step-icon').textContent = '⤫';
                stepBtn.querySelector('.step-label').textContent = 'vide';
            }
        }
        
        this.updatePatternNotation();
    }

    updatePatternNotation() {
        const notationElement = document.querySelector('.pattern-notation');
        if (notationElement) {
            const pattern = this.sequencerEngine.pattern;
            notationElement.textContent = pattern.join(' ');
        }
    }

    loadPresets() {
        const presetsGrid = document.getElementById('presets-grid');
        presetsGrid.innerHTML = '';
        
        const patterns = this.patternLibrary.getAllPatterns();
        patterns.forEach(pattern => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            card.dataset.id = pattern.id;
            
            card.innerHTML = `
                <div class="card-title">${pattern.name}</div>
                <div class="card-subtitle">${pattern.category}</div>
                <div class="card-tags">
                    <span class="tag">${pattern.difficulty}</span>
                    ${pattern.tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            `;

            card.addEventListener('click', () => this.selectPattern(pattern.id));
            card.title = pattern.description;
            presetsGrid.appendChild(card);
        });
    }

   selectPattern(patternId) {
    const pattern = this.patternLibrary.getPattern(patternId);
    if (!pattern) return;

    // 1. Charger le dessin rythmique (existant)
    this.sequencerEngine.setPattern(pattern.pattern);
    
    // 2. Lier le Tempo
    if (pattern.defaultTempo) {
        this.sequencerEngine.setTempo(pattern.defaultTempo);
        this.updateTempoDisplay();
    }

    // 3. Lier la Tonalité (Basse)
    if (pattern.defaultKey) {
        this.sequencerEngine.setChord(pattern.defaultKey);
        const keySelector = document.getElementById('bass-note-select');
        if (keySelector) keySelector.value = pattern.defaultKey;
    }

    // 4. Lier les réglages de batterie (Mixage automatique)
    if (pattern.drumSettings) {
                this.sequencerEngine.setDrumVolume('snare', pattern.drumSettings.snareVolume);
        this.sequencerEngine.setDrumVolume('kick', pattern.drumSettings.kickVolume);
    }

    this.createSequencerGrid();
    this.highlightSelectedPreset(patternId);
}

    loadSongs() {
        const songsGrid = document.getElementById('songs-grid');
        songsGrid.innerHTML = '';
        
        const songs = this.presetManager.getAllPresets();
        songs.forEach(song => {
            const card = document.createElement('div');
            card.className = 'song-card';
            card.dataset.id = song.id;
            
            card.innerHTML = `
                <div class="card-title">${song.title}</div>
                <div class="card-subtitle">${song.artist}</div>
                <div class="card-info">
                    <span>${song.bpm} BPM</span>
                    <span>${song.key}</span>
                </div>
                <div class="card-tags">
                    <span class="tag">${song.genre}</span>
                    <span class="tag">${song.difficulty}</span>
                </div>
            `;

            card.addEventListener('click', () => this.selectSong(song.id));
            card.title = song.tips;
            songsGrid.appendChild(card);
        });
    }

    selectSong(songId) {
        const song = this.presetManager.getPreset(songId);
        if (!song) return;

        // 1. Charger le pattern (comme avant)
        const pattern = song.patterns.verse || song.patterns.chorus || song.patterns;
        this.sequencerEngine.setPattern(pattern);
        
        // 2. Charger le BPM (comme avant)
        this.sequencerEngine.setTempo(song.bpm);
        this.updateTempoDisplay(); // On force la mise à jour visuelle
        
        // 3. Charger la Tonalité
        this.sequencerEngine.setChord(song.key);
        const keySelector = document.getElementById('bass-note-select');
        // Si le select existe, on change sa valeur pour correspondre
        if (keySelector) keySelector.value = song.key;
        
        // 4. 🥁 NOUVEAU : Appliquer les réglages de batterie (Mixage)
        // 4. 🥁 NOUVEAU : Appliquer les réglages de batterie (Mixage ET Visuel)
        if (song.drumSettings) {
            // A. Mise à jour du SON (Le cerveau)
            this.sequencerEngine.setDrumVolume('kick', song.drumSettings.kickVolume);
            this.sequencerEngine.setDrumVolume('snare', song.drumSettings.snareVolume);
            this.sequencerEngine.setDrumVolume('hihat', song.drumSettings.hihatVolume);
            
            // B. Mise à jour VISUELLE des 3 curseurs séparés (L'interface)
            // ⚠️ Pense à vérifier que ces IDs correspondent bien à ton fichier index.html
            const kickSlider = document.getElementById('kick-volume');   
            const snareSlider = document.getElementById('snare-volume'); 
            const hihatSlider = document.getElementById('hihat-volume'); 
            
            // On multiplie par 100 car le moteur utilise 0.8 mais le curseur affiche 80
            if (kickSlider) kickSlider.value = song.drumSettings.kickVolume * 100;
            if (snareSlider) snareSlider.value = song.drumSettings.snareVolume * 100;
            if (hihatSlider) hihatSlider.value = song.drumSettings.hihatVolume * 100;
        }
        
        this.currentPreset = song;
        this.currentPattern = pattern;
        
        this.createSequencerGrid();
        this.highlightSelectedSong(songId);
        
        document.getElementById('pattern-name').value = `${song.title} - ${song.artist}`;
    }

    highlightSelectedSong(songId) {
        document.querySelectorAll('.song-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === songId);
        });
    }

    loadUserPatterns() {
        const userPatternsGrid = document.getElementById('user-patterns-grid');
        userPatternsGrid.innerHTML = '';
        
        const savedPatterns = this.storageManager.getSavedPatterns();
        
        if (savedPatterns.length === 0) {
            userPatternsGrid.innerHTML = '<p style="text-align: center; color: #666;">Aucun pattern sauvegardé</p>';
            return;
        }
        
        savedPatterns.forEach(pattern => {
            const card = document.createElement('div');
            card.className = 'user-pattern-card';
            card.dataset.id = pattern.id;
            
            card.innerHTML = `
                <div class="card-title">${pattern.name}</div>
                <div class="card-pattern">${pattern.pattern.join(' ')}</div>
                <div class="card-tags">
                    <span class="tag">${pattern.difficulty || 'moyen'}</span>
                    <span class="tag">${pattern.category || 'custom'}</span>
                </div>
                <div class="card-actions">
                    <button class="delete-btn" onclick="event.stopPropagation(); app.uiSequencer.deleteUserPattern('${pattern.id}')">×</button>
                </div>
            `;

            card.addEventListener('click', () => this.loadUserPattern(pattern.id));
            userPatternsGrid.appendChild(card);
        });
    }

    loadUserPattern(patternId) {
        const savedPatterns = this.storageManager.getSavedPatterns();
        const pattern = savedPatterns.find(p => p.id === patternId);
        if (!pattern) return;

        this.sequencerEngine.setPattern(pattern.pattern);
        this.currentPattern = pattern.pattern;
        this.currentPreset = null;
        
        this.createSequencerGrid();
        this.highlightSelectedUserPattern(patternId);
        
        document.getElementById('pattern-name').value = pattern.name;
    }

    highlightSelectedUserPattern(patternId) {
        document.querySelectorAll('.user-pattern-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === patternId);
        });
    }

    deleteUserPattern(patternId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce pattern ?')) {
            this.storageManager.deletePattern(patternId);
            this.loadUserPatterns();
        }
    }

    bindEvents() {
        // --- ÉVÉNEMENTS VOLUMES (Modifiés pour utiliser les méthodes) ---
        document.getElementById('master-drum-vol')?.addEventListener('input', (e) => this.syncDrumVolume(e.target.value));
        document.getElementById('master-bass-vol')?.addEventListener('input', (e) => this.syncBassVolume(e.target.value));
        document.getElementById('bass-volume')?.addEventListener('input', (e) => this.syncBassVolume(e.target.value));

        document.addEventListener('keydown', (event) => {
            const activeEl = document.activeElement;
            const isTextInput = activeEl.tagName === 'INPUT' && (activeEl.type === 'text' || activeEl.type === 'number');

            if (event.code === 'Space' && !isTextInput) {
                event.preventDefault();
                activeEl.blur();
                this.togglePlay();
            }

            if (event.code === 'ArrowUp' && !isTextInput) {
                event.preventDefault();
                this.sequencerEngine.setTempo(this.sequencerEngine.bpm + 1);
                this.updateTempoDisplay();
            }
            if (event.code === 'ArrowDown' && !isTextInput) {
                event.preventDefault();
                this.sequencerEngine.setTempo(this.sequencerEngine.bpm - 1);
                this.updateTempoDisplay();
            }
        });

        const btn8 = document.getElementById('btn-8-steps');
        const btn16 = document.getElementById('btn-16-steps');

        if (btn8 && btn16) {
            btn8.addEventListener('click', (e) => {
                this.sequencerEngine.setGridSize(8);
                this.createSequencerGrid();
            });

            btn16.addEventListener('click', (e) => {
                this.sequencerEngine.setGridSize(16);
                this.createSequencerGrid();
            });
        }

        document.getElementById('play-btn').addEventListener('click', async () => {
    // 💡 On vérifie l'orientation avant de lancer la musique
    this.checkOrientationForAction();
            if (!this.sequencerEngine.audioManager.audioContext) {
                await this.sequencerEngine.audioManager.createAudioContextOnUserGesture();
            }
            
            const audioCtx = this.sequencerEngine.audioManager.audioContext;
            if (audioCtx && audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }
            this.togglePlay(); 
        });

        document.getElementById('loop-btn').addEventListener('click', () => {
            this.toggleLoop();
        });

        document.getElementById('tempo-slider').addEventListener('input', (e) => this.changeTempo(e));
        document.getElementById('tempo-input').addEventListener('change', (e) => this.changeTempo(e));
        
        document.getElementById('bass-note-select').addEventListener('change', (e) => {
            this.sequencerEngine.setChord(e.target.value);
        });

        document.getElementById('clear-btn').addEventListener('click', () => {
            const total = this.sequencerEngine.totalSteps;
            this.sequencerEngine.setPattern(new Array(total).fill('-'));
            this.updateSequencerGrid();
        });

        document.getElementById('fill-btn').addEventListener('click', () => {
            const total = this.sequencerEngine.totalSteps;
            const newPattern = [];
            for (let i = 0; i < total; i++) {
                newPattern.push(i % 2 === 0 ? 'D' : 'U'); 
            }
            this.sequencerEngine.setPattern(newPattern);
            this.updateSequencerGrid();
        });

        document.getElementById('random-btn').addEventListener('click', () => {
            const total = this.sequencerEngine.totalSteps;
            const newPattern = [];
            for (let i = 0; i < total; i++) {
                const isOffbeat = i % 2 === 1;
                if (isOffbeat) {
                    newPattern.push(Math.random() > 0.5 ? 'U' : '-');
                } else {
                    newPattern.push(Math.random() > 0.5 ? 'D' : '-');
                }
            }
            this.sequencerEngine.setPattern(newPattern);
            this.updateSequencerGrid();
        });

        document.getElementById('save-btn').addEventListener('click', () => this.savePattern());
        document.getElementById('export-btn').addEventListener('click', () => this.exportPatterns());
        document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
        document.getElementById('import-file').addEventListener('change', (e) => this.importPatterns(e));
        
        const searchInput = document.getElementById('songs-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterSongs(e.target.value));
        }
        
        const difficultyFilter = document.getElementById('difficulty-filter');
        if (difficultyFilter) {
            difficultyFilter.addEventListener('change', (e) => this.filterByDifficulty(e.target.value));
        }

        this.sequencerEngine.onStep((stepIndex, stepValue, time) => {
            this.highlightStep(stepIndex);
            this.animateStep(stepIndex, stepValue);
        });
    }

    async startWithCountIn() {
        const playBtn = document.getElementById('play-btn');
        const btnText = playBtn.querySelector('.btn-text');
        const originalText = btnText.textContent;
        
        playBtn.classList.add('active');
        playBtn.style.pointerEvents = 'none';
        
        const beatDurationMs = (60 / this.sequencerEngine.bpm) * 1000;

        for (let i = 4; i > 0; i--) {
            if (btnText) btnText.textContent = i;
            this.sequencerEngine.audioManager.playDrumSample('hihat', 0.8); 
            await new Promise(resolve => setTimeout(resolve, beatDurationMs));
        }

        if (btnText) btnText.textContent = originalText;
        playBtn.style.pointerEvents = 'auto';
        this.sequencerEngine.start();
        this.updateTransportUI();
    }

    togglePlay() {
        if (this.sequencerEngine.isRunning) {
            this.sequencerEngine.pause();
        } else {
            const countInCheckbox = document.getElementById('count-in-toggle');
            const useCountIn = countInCheckbox ? countInCheckbox.checked : true;

            if (useCountIn) {
                this.startWithCountIn();
            } else {
                this.sequencerEngine.start();
            }
        }
        this.updateTransportUI();
    }

    stop() {
        this.sequencerEngine.stop();
        this.updatePlayhead(-1);
        this.updateTransportUI();
    }

    toggleLoop() {
        this.sequencerEngine.setLooping(!this.sequencerEngine.looping);
        this.updateTransportUI();
    }

    changeTempo(event) {
        const newTempo = parseInt(event.target.value);
        this.sequencerEngine.setTempo(newTempo);
        this.updateTempoDisplay(); 
    }

    savePattern() {
        const patternName = document.getElementById('pattern-name').value.trim();
        if (!patternName) {
            alert('Veuillez saisir un nom de pattern avant de sauvegarder');
            return;
        }

        const patternData = {
            name: patternName,
            pattern: this.sequencerEngine.pattern,
            difficulty: 'moyen',
            category: 'custom',
            tags: []
        };

        this.storageManager.savePattern(patternData);
        alert('Pattern sauvegardé avec succès !');
        this.loadUserPatterns();
        document.getElementById('pattern-name').value = '';
    }

    exportPatterns() {
        const data = this.storageManager.exportPatterns();
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `easystrum-patterns-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importPatterns(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedCount = this.storageManager.importData(e.target.result);
                alert(`${importedCount} patterns importés avec succès.`);
                this.loadUserPatterns();
            } catch (error) {
                alert('Erreur lors de l\'import du fichier');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    updateTransportUI() {
        const playBtn = document.getElementById('play-btn');
        const loopBtn = document.getElementById('loop-btn');

        if (this.sequencerEngine.isRunning) {
            playBtn.classList.add('active');
            const txt = playBtn.querySelector('.btn-text');
            if (txt) txt.textContent = 'Pause';
            const icon = playBtn.querySelector('.btn-icon');
            if (icon) icon.textContent = '⏸';
        } else {
            playBtn.classList.remove('active');
            const txt = playBtn.querySelector('.btn-text');
            if (txt) txt.textContent = 'Play';
            const icon = playBtn.querySelector('.btn-icon');
            if (icon) icon.textContent = '▶';
        }

        if (this.sequencerEngine.looping) {
            loopBtn.classList.add('active');
        } else {
            loopBtn.classList.remove('active');
        }
    }

    updateTempoDisplay() {
        const tempoSlider = document.getElementById('tempo-slider');
        const tempoInput = document.getElementById('tempo-input');
        if (tempoSlider) tempoSlider.value = this.sequencerEngine.bpm;
        if (tempoInput) tempoInput.value = this.sequencerEngine.bpm;
    }

    highlightStep(stepIndex) {
        this.updatePlayhead(stepIndex);
    }

    updatePlayhead(stepIndex) {
        const playhead = document.getElementById('playhead');
        if (!playhead) return;

        if (stepIndex < 0) {
            playhead.style.display = 'none';
            return;
        }

        playhead.style.display = 'block';
        const stepBtn = document.querySelector(`button[data-step="${stepIndex}"]`);
        
        if (stepBtn) {
            playhead.style.left = `${stepBtn.offsetLeft}px`;
            playhead.style.width = `${stepBtn.offsetWidth}px`;
        }
        
        if (stepIndex === 0) {
            const wrapper = document.getElementById('sequencer-wrapper');
            if (wrapper) wrapper.scrollTo({ left: 0, behavior: 'smooth' });
        } 
        else if (stepIndex === 8) {
            const step9 = document.querySelector('button[data-step="8"]');
            if (step9) {
                step9.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
            }
        }

        playhead.classList.remove('active');
        setTimeout(() => playhead.classList.add('active'), 10);
    }

    animateStep(stepIndex, stepValue) {
        if (stepValue && stepValue !== '-') {
            const stepBtn = document.querySelector(`button[data-step="${stepIndex}"]`);
            if (stepBtn) {
                stepBtn.classList.add('hit');
                setTimeout(() => stepBtn.classList.remove('hit'), 200);
            }
        }
    }

    highlightSelectedPreset(presetId) {
        document.querySelectorAll('.preset-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === presetId);
        });
        document.querySelectorAll('.song-card, .user-pattern-card').forEach(card => {
            card.classList.remove('active');
        });
    }

    loadInitialData() {
        this.loadSongs();
        const defaultPattern = this.patternLibrary.getPattern('folk-basique-2');
        if (defaultPattern) {
            this.selectPattern('folk-basique-2');
        }
    }

    dispose() {
        this.sequencerEngine.dispose();
    }
}

window.UISequencer = UISequencer;