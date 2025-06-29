// VIB3 Icon Generator
// Run with: node generate-icon.js

const fs = require('fs');
const { createCanvas } = require('canvas');

function createVIB3Icon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient (simulated with solid color for Node.js)
    ctx.fillStyle = '#FF0050'; // VIB3 primary color
    ctx.fillRect(0, 0, size, size);
    
    // Add rounded corners effect (simplified)
    const radius = size * 0.22;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw "V" symbol
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = size * 0.078;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(size * 0.27, size * 0.31);
    ctx.lineTo(size * 0.5, size * 0.74);
    ctx.lineTo(size * 0.73, size * 0.31);
    ctx.stroke();
    
    // Draw three dots for "3"
    ctx.fillStyle = '#FFFFFF';
    const dotRadius = size * 0.024;
    const dotX = size * 0.78;
    
    [0.35, 0.43, 0.51].forEach(y => {
        ctx.beginPath();
        ctx.arc(dotX, size * y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    return canvas;
}

// Check if canvas module is available
try {
    console.log('📱 VIB3 Icon Generator');
    console.log('⚠️  This requires: npm install canvas');
    console.log('💡 Alternative: Open create-icons.html in your browser');
} catch (error) {
    console.log('Canvas module not available. Use create-icons.html instead.');
}