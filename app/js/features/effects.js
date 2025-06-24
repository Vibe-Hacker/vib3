// Effects Engine - AR filters, video effects, and visual enhancements
export class EffectsEngine {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.video = null;
        this.activeEffects = [];
        this.filters = new Map();
        this.animations = new Map();
        this.isProcessing = false;
        
        this.config = {
            frameRate: 30,
            quality: 0.8,
            maxEffects: 5
        };
    }

    async initialize() {
        console.log('✨ Initializing Effects Engine...');
        await this.loadFilters();
        await this.loadAnimations();
        this.setupCanvas();
    }

    async loadFilters() {
        // CSS-based filters
        this.filters.set('normal', { type: 'css', filter: '' });
        this.filters.set('vibrant', { type: 'css', filter: 'contrast(1.2) saturate(1.3)' });
        this.filters.set('vintage', { type: 'css', filter: 'sepia(0.3) contrast(1.1)' });
        this.filters.set('bw', { type: 'css', filter: 'grayscale(1) contrast(1.2)' });
        this.filters.set('cold', { type: 'css', filter: 'hue-rotate(180deg) saturate(0.8)' });
        this.filters.set('warm', { type: 'css', filter: 'sepia(0.2) saturate(1.2)' });
        this.filters.set('fade', { type: 'css', filter: 'contrast(0.8) brightness(1.2)' });
        this.filters.set('neon', { type: 'css', filter: 'drop-shadow(0 0 10px #00ff00) contrast(1.5)' });
        this.filters.set('retro', { type: 'css', filter: 'sepia(0.8) saturate(2) hue-rotate(315deg)' });
        
        // Canvas-based filters
        this.filters.set('blur', { type: 'canvas', processor: this.blurFilter });
        this.filters.set('pixelate', { type: 'canvas', processor: this.pixelateFilter });
        this.filters.set('glitch', { type: 'canvas', processor: this.glitchFilter });
        this.filters.set('rainbow', { type: 'canvas', processor: this.rainbowFilter });
        
        console.log(`📱 Loaded ${this.filters.size} filters`);
    }

    async loadAnimations() {
        // Motion effects
        this.animations.set('shake', {
            type: 'transform',
            keyframes: [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(0)' }
            ],
            duration: 100,
            iterations: Infinity
        });

        this.animations.set('zoom', {
            type: 'transform',
            keyframes: [
                { transform: 'scale(1)' },
                { transform: 'scale(1.1)' },
                { transform: 'scale(1)' }
            ],
            duration: 1000,
            iterations: Infinity
        });

        this.animations.set('bounce', {
            type: 'transform',
            keyframes: [
                { transform: 'translateY(0)' },
                { transform: 'translateY(-10px)' },
                { transform: 'translateY(0)' }
            ],
            duration: 600,
            iterations: Infinity
        });

        this.animations.set('spin', {
            type: 'transform',
            keyframes: [
                { transform: 'rotate(0deg)' },
                { transform: 'rotate(360deg)' }
            ],
            duration: 2000,
            iterations: Infinity
        });

        console.log(`🎯 Loaded ${this.animations.size} animations`);
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '10';
    }

    // Apply effect to video element
    applyEffect(videoElement, effectName, options = {}) {
        const effect = this.filters.get(effectName) || this.animations.get(effectName);
        if (!effect) {
            console.warn(`Effect "${effectName}" not found`);
            return;
        }

        // Remove existing effects of the same type
        this.removeEffect(videoElement, effectName);

        if (effect.type === 'css') {
            this.applyCSSEffect(videoElement, effectName, effect, options);
        } else if (effect.type === 'canvas') {
            this.applyCanvasEffect(videoElement, effectName, effect, options);
        } else if (effect.type === 'transform') {
            this.applyTransformEffect(videoElement, effectName, effect, options);
        }

        // Track active effects
        this.activeEffects.push({
            element: videoElement,
            name: effectName,
            type: effect.type,
            options: options
        });

        console.log(`✨ Applied effect: ${effectName}`);
    }

    applyCSSEffect(videoElement, effectName, effect, options) {
        const existingFilter = videoElement.style.filter || '';
        const newFilter = effect.filter;
        
        // Combine filters
        if (existingFilter && !existingFilter.includes(newFilter)) {
            videoElement.style.filter = existingFilter + ' ' + newFilter;
        } else {
            videoElement.style.filter = newFilter;
        }
        
        videoElement.dataset.effectName = effectName;
    }

    applyCanvasEffect(videoElement, effectName, effect, options) {
        if (!this.canvas.parentElement) {
            videoElement.parentElement.appendChild(this.canvas);
        }

        // Set canvas size to match video
        this.canvas.width = videoElement.videoWidth || videoElement.offsetWidth;
        this.canvas.height = videoElement.videoHeight || videoElement.offsetHeight;
        
        // Position canvas over video
        const rect = videoElement.getBoundingClientRect();
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // Start processing
        this.processCanvasEffect(videoElement, effect, options);
    }

    applyTransformEffect(videoElement, effectName, effect, options) {
        const animation = videoElement.animate(effect.keyframes, {
            duration: effect.duration,
            iterations: effect.iterations,
            easing: options.easing || 'ease-in-out'
        });

        videoElement.dataset.effectName = effectName;
        videoElement.dataset.animationId = animation.id;
    }

    processCanvasEffect(videoElement, effect, options) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        const processFrame = () => {
            if (!videoElement.paused && !videoElement.ended) {
                this.context.drawImage(videoElement, 0, 0, this.canvas.width, this.canvas.height);
                
                // Apply effect processor
                if (effect.processor) {
                    effect.processor.call(this, options);
                }
                
                requestAnimationFrame(processFrame);
            } else {
                this.isProcessing = false;
            }
        };
        
        requestAnimationFrame(processFrame);
    }

    // Canvas effect processors
    blurFilter(options = {}) {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const radius = options.radius || 2;
        
        // Simple box blur
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            data[i] = Math.min(255, r * 1.1);
            data[i + 1] = Math.min(255, g * 1.1);
            data[i + 2] = Math.min(255, b * 1.1);
        }
        
        this.context.putImageData(imageData, 0, 0);
    }

    pixelateFilter(options = {}) {
        const size = options.size || 8;
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < this.canvas.height; y += size) {
            for (let x = 0; x < this.canvas.width; x += size) {
                const pixelIndex = (y * this.canvas.width + x) * 4;
                const r = imageData.data[pixelIndex];
                const g = imageData.data[pixelIndex + 1];
                const b = imageData.data[pixelIndex + 2];
                
                // Fill block with average color
                this.context.fillStyle = `rgb(${r}, ${g}, ${b})`;
                this.context.fillRect(x, y, size, size);
            }
        }
    }

    glitchFilter(options = {}) {
        const intensity = options.intensity || 0.1;
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // Random color channel shifts
        for (let i = 0; i < data.length; i += 4) {
            if (Math.random() < intensity) {
                const shift = Math.floor(Math.random() * 20) - 10;
                const targetIndex = Math.max(0, Math.min(data.length - 4, i + shift * 4));
                
                data[i] = data[targetIndex];     // R
                data[i + 1] = data[targetIndex + 1]; // G
                data[i + 2] = data[targetIndex + 2]; // B
            }
        }
        
        this.context.putImageData(imageData, 0, 0);
    }

    rainbowFilter(options = {}) {
        const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % this.canvas.width;
            const hue = (x / this.canvas.width * 360 + time * 50) % 360;
            
            const [r, g, b] = this.hslToRgb(hue, 0.5, 0.5);
            
            data[i] = (data[i] + r) / 2;
            data[i + 1] = (data[i + 1] + g) / 2;
            data[i + 2] = (data[i + 2] + b) / 2;
        }
        
        this.context.putImageData(imageData, 0, 0);
    }

    // Remove effect from video element
    removeEffect(videoElement, effectName) {
        const effectIndex = this.activeEffects.findIndex(
            effect => effect.element === videoElement && effect.name === effectName
        );
        
        if (effectIndex !== -1) {
            const effect = this.activeEffects[effectIndex];
            
            if (effect.type === 'css') {
                videoElement.style.filter = '';
            } else if (effect.type === 'canvas') {
                if (this.canvas.parentElement) {
                    this.canvas.parentElement.removeChild(this.canvas);
                }
            } else if (effect.type === 'transform') {
                const animationId = videoElement.dataset.animationId;
                if (animationId) {
                    const animation = document.getAnimations().find(a => a.id === animationId);
                    if (animation) animation.cancel();
                }
            }
            
            this.activeEffects.splice(effectIndex, 1);
            console.log(`🗑️ Removed effect: ${effectName}`);
        }
    }

    // Remove all effects from video element
    removeAllEffects(videoElement) {
        const videoEffects = this.activeEffects.filter(effect => effect.element === videoElement);
        
        videoEffects.forEach(effect => {
            this.removeEffect(videoElement, effect.name);
        });
    }

    // Get available effects
    getAvailableFilters() {
        return Array.from(this.filters.keys());
    }

    getAvailableAnimations() {
        return Array.from(this.animations.keys());
    }

    // Utility functions
    hslToRgb(h, s, l) {
        h /= 360;
        const a = s * Math.min(l, 1 - l);
        const f = n => {
            const k = (n + h / (1/12)) % 1;
            return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        };
        return [f(0) * 255, f(8) * 255, f(4) * 255];
    }

    // Preset effect combinations
    applyPreset(videoElement, presetName) {
        const presets = {
            'video-classic': ['vibrant', 'zoom'],
            'retro-vibe': ['vintage', 'shake'],
            'neon-night': ['neon', 'bounce'],
            'glitch-art': ['glitch', 'spin'],
            'dreamy': ['blur', 'rainbow'],
            'vintage-film': ['retro', 'fade']
        };

        const preset = presets[presetName];
        if (preset) {
            preset.forEach(effectName => {
                this.applyEffect(videoElement, effectName);
            });
        }
    }

    // Performance monitoring
    getPerformanceStats() {
        return {
            activeEffects: this.activeEffects.length,
            isProcessing: this.isProcessing,
            canvasSize: this.canvas ? `${this.canvas.width}x${this.canvas.height}` : 'N/A'
        };
    }
}

export default EffectsEngine;