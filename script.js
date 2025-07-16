// Text to Speech Converter JavaScript

class TextToSpeechConverter {
    constructor() {
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.voices = [];
        this.isPlaying = false;
        this.isPaused = false;
        
        // Get DOM elements
        this.textInput = document.getElementById('textInput');
        this.speakBtn = document.getElementById('speakBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resumeBtn = document.getElementById('resumeBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.speedRange = document.getElementById('speedRange');
        this.pitchRange = document.getElementById('pitchRange');
        this.speedValue = document.getElementById('speedValue');
        this.pitchValue = document.getElementById('pitchValue');
        this.charCount = document.getElementById('charCount');
        this.status = document.getElementById('status');
        
        this.init();
    }
    
    init() {
        // Check if browser supports Speech Synthesis
        if (!this.synth) {
            this.showError('Your browser does not support text-to-speech functionality.');
            return;
        }
        
        // Load voices
        this.loadVoices();
        
        // Event listeners
        this.setupEventListeners();
        
        // Initial character count
        this.updateCharCount();
        
        this.updateStatus('Ready to convert text to speech');
    }
    
    loadVoices() {
        // Load voices when they become available
        const loadVoicesHandler = () => {
            this.voices = this.synth.getVoices();
            this.populateVoiceSelect();
        };
        
        // Voices might load asynchronously
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoicesHandler;
        }
        
        // Try to load voices immediately
        loadVoicesHandler();
    }
    
    populateVoiceSelect() {
        // Clear existing options except default
        this.voiceSelect.innerHTML = '<option value="">Default Voice</option>';
        
        // Add available voices
        this.voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            
            // Mark default voice
            if (voice.default) {
                option.textContent += ' - Default';
            }
            
            this.voiceSelect.appendChild(option);
        });
    }
    
    setupEventListeners() {
        // Speak button
        this.speakBtn.addEventListener('click', () => this.speak());
        
        // Control buttons
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resumeBtn.addEventListener('click', () => this.resume());
        this.stopBtn.addEventListener('click', () => this.stop());
        
        // Text input
        this.textInput.addEventListener('input', () => this.updateCharCount());
        this.textInput.addEventListener('keydown', (e) => {
            // Allow Ctrl+Enter to speak
            if (e.ctrlKey && e.key === 'Enter') {
                this.speak();
            }
        });
        
        // Range inputs
        this.speedRange.addEventListener('input', () => {
            this.speedValue.textContent = this.speedRange.value + 'x';
        });
        
        this.pitchRange.addEventListener('input', () => {
            this.pitchValue.textContent = this.pitchRange.value + 'x';
        });
        
        // Voice selection
        this.voiceSelect.addEventListener('change', () => {
            // Stop current speech if playing
            if (this.isPlaying) {
                this.stop();
            }
        });
    }
    
    speak() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.showError('Please enter some text to convert to speech.');
            this.textInput.focus();
            return;
        }
        
        if (this.isPlaying) {
            this.stop();
        }
        
        try {
            // Create new utterance
            this.utterance = new SpeechSynthesisUtterance(text);
            
            // Set voice
            const selectedVoiceIndex = this.voiceSelect.value;
            if (selectedVoiceIndex && this.voices[selectedVoiceIndex]) {
                this.utterance.voice = this.voices[selectedVoiceIndex];
            }
            
            // Set speech parameters
            this.utterance.rate = parseFloat(this.speedRange.value);
            this.utterance.pitch = parseFloat(this.pitchRange.value);
            this.utterance.volume = 1;
            
            // Event handlers
            this.utterance.onstart = () => {
                this.isPlaying = true;
                this.isPaused = false;
                this.updateButtonStates();
                this.updateStatus('Speaking...', 'speaking');
                this.speakBtn.classList.add('speaking');
            };
            
            this.utterance.onend = () => {
                this.isPlaying = false;
                this.isPaused = false;
                this.updateButtonStates();
                this.updateStatus('Speech completed successfully', 'success');
                this.speakBtn.classList.remove('speaking');
            };
            
            this.utterance.onerror = (event) => {
                this.isPlaying = false;
                this.isPaused = false;
                this.updateButtonStates();
                this.showError(`Speech synthesis error: ${event.error}`);
                this.speakBtn.classList.remove('speaking');
            };
            
            this.utterance.onpause = () => {
                this.isPaused = true;
                this.updateButtonStates();
                this.updateStatus('Speech paused', 'paused');
            };
            
            this.utterance.onresume = () => {
                this.isPaused = false;
                this.updateButtonStates();
                this.updateStatus('Speech resumed', 'speaking');
            };
            
            // Start speaking
            this.synth.speak(this.utterance);
            
        } catch (error) {
            this.showError(`Error starting speech synthesis: ${error.message}`);
        }
    }
    
    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.synth.pause();
        }
    }
    
    resume() {
        if (this.isPlaying && this.isPaused) {
            this.synth.resume();
        }
    }
    
    stop() {
        if (this.isPlaying) {
            this.synth.cancel();
            this.isPlaying = false;
            this.isPaused = false;
            this.updateButtonStates();
            this.updateStatus('Speech stopped');
            this.speakBtn.classList.remove('speaking');
        }
    }
    
    updateButtonStates() {
        // Speak button
        this.speakBtn.disabled = this.isPlaying && !this.isPaused;
        this.speakBtn.innerHTML = this.isPlaying ? 
            '<span class="btn-icon">⏹️</span>Stop & Restart' : 
            '<span class="btn-icon">🔊</span>Speak Text';
        
        // Control buttons
        this.pauseBtn.disabled = !this.isPlaying || this.isPaused;
        this.resumeBtn.disabled = !this.isPaused;
        this.stopBtn.disabled = !this.isPlaying;
    }
    
    updateCharCount() {
        const count = this.textInput.value.length;
        this.charCount.textContent = count;
        
        // Change color based on character count
        if (count > 4500) {
            this.charCount.style.color = '#f44336';
        } else if (count > 4000) {
            this.charCount.style.color = '#ff9800';
        } else {
            this.charCount.style.color = '#666';
        }
    }
    
    updateStatus(message, type = '') {
        this.status.textContent = message;
        this.status.className = 'status';
        if (type) {
            this.status.classList.add(type);
        }
    }
    
    showError(message) {
        this.updateStatus(message, 'error');
        console.error('TTS Error:', message);
    }
}

// Utility functions
function addSampleTexts() {
    const sampleTexts = [
        "Hello! Welcome to our text-to-speech converter. This tool can help you convert any written text into natural-sounding speech.",
        "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
        "Technology has revolutionized the way we communicate, learn, and work in the modern world.",
        "Artificial intelligence and machine learning are transforming industries across the globe."
    ];
    
    // Add sample text buttons (optional feature)
    const container = document.querySelector('.input-section');
    const sampleContainer = document.createElement('div');
    sampleContainer.className = 'sample-texts';
    sampleContainer.innerHTML = '<p style="margin: 10px 0; font-size: 0.9rem; color: #666;">Quick samples:</p>';
    
    sampleTexts.forEach((text, index) => {
        const button = document.createElement('button');
        button.textContent = `Sample ${index + 1}`;
        button.className = 'sample-btn';
        button.style.cssText = `
            margin: 5px;
            padding: 5px 10px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 15px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        button.addEventListener('click', () => {
            document.getElementById('textInput').value = text;
            document.getElementById('textInput').dispatchEvent(new Event('input'));
        });
        
        button.addEventListener('mouseenter', () => {
            button.style.borderColor = '#4facfe';
            button.style.color = '#4facfe';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.borderColor = '#ddd';
            button.style.color = 'inherit';
        });
        
        sampleContainer.appendChild(button);
    });
    
    container.appendChild(sampleContainer);
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the TTS converter
    const ttsConverter = new TextToSpeechConverter();
    
    // Add sample texts (optional)
    addSampleTexts();
    
    // Add keyboard shortcuts info
    const shortcutInfo = document.createElement('div');
    shortcutInfo.style.cssText = `
        text-align: center;
        margin-top: 20px;
        padding: 10px;
        background: #f0f8ff;
        border-radius: 8px;
        font-size: 0.85rem;
        color: #666;
    `;
    shortcutInfo.innerHTML = '💡 <strong>Tip:</strong> Press Ctrl+Enter to quickly convert text to speech';
    
    document.querySelector('main').appendChild(shortcutInfo);
    
    // Add browser compatibility check
    if (!window.speechSynthesis) {
        const warningDiv = document.createElement('div');
        warningDiv.style.cssText = `
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        `;
        warningDiv.innerHTML = `
            <strong>⚠️ Browser Compatibility Notice:</strong><br>
            Your browser may not fully support text-to-speech functionality. 
            For the best experience, please use a modern browser like Chrome, Firefox, or Safari.
        `;
        
        document.querySelector('main').insertBefore(warningDiv, document.querySelector('.input-section'));
    }
});

// Handle page visibility changes (pause speech when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextToSpeechConverter;
}
