// Simple red VIB3 icon generator
const fs = require('fs');

// Create SVG version first
const redIconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#000000"/>
  <defs>
    <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF3333;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FF0000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#CC0000;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge> 
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <text x="256" y="280" font-family="Arial, sans-serif" font-size="140" font-weight="bold" 
        text-anchor="middle" fill="url(#redGradient)" filter="url(#glow)">VIB3</text>
  <circle cx="420" cy="150" r="25" fill="#FF3333"/>
</svg>`;

fs.writeFileSync('icon.svg', redIconSVG);
console.log('Red VIB3 icon created as icon.svg');
console.log('You can convert this to PNG using an online converter or image editing software');