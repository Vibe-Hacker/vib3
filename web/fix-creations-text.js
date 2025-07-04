// Script to find and fix any remaining "VIB3 Creations" or "Creator Fund" text

// Function to replace all instances of old text with new text in the DOM
function replaceTextInDOM() {
    console.log('🔍 Searching for VIB3 Creations text to replace...');
    
    // Find all text nodes in the document
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    let replacements = 0;
    textNodes.forEach(textNode => {
        if (textNode.textContent.includes('VIB3 Creations')) {
            textNode.textContent = textNode.textContent.replace(/VIB3 Creations/g, 'VIB3 Studio');
            replacements++;
            console.log('✅ Replaced "VIB3 Creations" with "VIB3 Studio"');
        }
        if (textNode.textContent.includes('Creator Fund')) {
            textNode.textContent = textNode.textContent.replace(/Creator Fund/g, 'VIB3 Studio');
            replacements++;
            console.log('✅ Replaced "Creator Fund" with "VIB3 Studio"');
        }
    });
    
    // Also check and fix any input values, placeholders, titles, etc.
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
        // Check attributes
        ['title', 'placeholder', 'alt', 'value', 'aria-label'].forEach(attr => {
            if (el.getAttribute(attr)) {
                let attrValue = el.getAttribute(attr);
                if (attrValue.includes('VIB3 Creations')) {
                    el.setAttribute(attr, attrValue.replace(/VIB3 Creations/g, 'VIB3 Studio'));
                    replacements++;
                    console.log('✅ Replaced "VIB3 Creations" in', attr, 'attribute');
                }
                if (attrValue.includes('Creator Fund')) {
                    el.setAttribute(attr, attrValue.replace(/Creator Fund/g, 'VIB3 Studio'));
                    replacements++;
                    console.log('✅ Replaced "Creator Fund" in', attr, 'attribute');
                }
            }
        });
    });
    
    console.log(`🎯 Total replacements made: ${replacements}`);
    
    if (replacements > 0) {
        console.log('✅ Text replacement complete! All instances should now show "VIB3 Studio"');
    } else {
        console.log('ℹ️ No instances of "VIB3 Creations" or "Creator Fund" found in current DOM');
    }
}

// Run the replacement function
replaceTextInDOM();

// Also set up a mutation observer to catch any dynamically added content
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if the added element contains the old text
                    if (node.textContent && (node.textContent.includes('VIB3 Creations') || node.textContent.includes('Creator Fund'))) {
                        console.log('🔄 New content added with old text, fixing...');
                        setTimeout(replaceTextInDOM, 100); // Small delay to ensure content is fully rendered
                    }
                }
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log('👀 Text replacement observer activated - will catch any dynamically added content');

// Export for manual use
window.fixCreationsText = replaceTextInDOM;