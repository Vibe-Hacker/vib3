// Fix for VIB3 Studio ID mismatch issue
// This demonstrates the pattern to fix the importCreatorMedia function

// Example of the ID mismatch fix pattern:
function fixImportCreatorMedia() {
    // BEFORE (causing mismatch):
    // 1. Generate new ID during import: const newFileId = Date.now();
    // 2. Store with new ID: window.creatorStudioFiles[newFileId] = file;
    // 3. But lookup uses original mediaId from localStorage
    
    // AFTER (fixed version):
    function importCreatorMedia(files) {
        console.log('📁 Importing creator media files:', files.length);
        
        files.forEach((file, index) => {
            // CRITICAL FIX: Use consistent ID
            
            // Option 1: Always use the existing mediaId if it exists
            let fileId = file.mediaId || `media_${Date.now()}_${index}`;
            
            // Option 2: Generate once and store consistently
            if (!file.id) {
                fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                file.id = fileId;  // Store on the file object itself
            } else {
                fileId = file.id;  // Use existing ID
            }
            
            // Store in memory with the SAME ID that will be used for lookup
            if (!window.creatorStudioFiles) {
                window.creatorStudioFiles = {};
            }
            
            window.creatorStudioFiles[fileId] = {
                ...file,
                id: fileId,  // Ensure ID is consistent
                importedAt: Date.now(),
                status: 'imported'
            };
            
            // Store the SAME ID in localStorage for later lookup
            const mediaData = {
                id: fileId,  // SAME ID used above
                name: file.name,
                type: file.type,
                size: file.size,
                importedAt: Date.now()
            };
            
            // Save to localStorage using the SAME ID
            localStorage.setItem(`vib3_media_${fileId}`, JSON.stringify(mediaData));
            
            // Update availableFileIds list with the SAME ID
            let availableIds = JSON.parse(localStorage.getItem('vib3_availableFileIds') || '[]');
            if (!availableIds.includes(fileId)) {
                availableIds.push(fileId);
                localStorage.setItem('vib3_availableFileIds', JSON.stringify(availableIds));
            }
            
            console.log(`✅ File imported with consistent ID: ${fileId}`);
        });
        
        // Update UI to show imported files
        updateCreatorMediaPreview();
    }
    
    // Fixed preview function that uses consistent IDs
    function previewCreatorMedia(mediaId) {
        console.log(`🔍 Looking for media with ID: ${mediaId}`);
        
        // CRITICAL: Use the SAME ID that was used during storage
        const file = window.creatorStudioFiles && window.creatorStudioFiles[mediaId];
        
        if (!file) {
            console.error(`❌ File missing from memory for ID: ${mediaId}`);
            console.log('Available file IDs:', Object.keys(window.creatorStudioFiles || {}));
            
            // Try to recover from localStorage
            const savedData = localStorage.getItem(`vib3_media_${mediaId}`);
            if (savedData) {
                console.log('📥 Attempting to recover from localStorage');
                // Implement recovery logic here
                return;
            }
            
            showError(`File not found: ${mediaId}`);
            return;
        }
        
        console.log(`✅ Found file: ${file.name}`);
        // Show preview with the found file
        displayMediaPreview(file);
    }
    
    // Fixed cleanup function
    function clearCreatorMedia() {
        // Clear memory storage
        window.creatorStudioFiles = {};
        
        // Clear localStorage entries
        const availableIds = JSON.parse(localStorage.getItem('vib3_availableFileIds') || '[]');
        availableIds.forEach(id => {
            localStorage.removeItem(`vib3_media_${id}`);
        });
        
        // Clear the available IDs list
        localStorage.removeItem('vib3_availableFileIds');
        
        console.log('🧹 Cleared all creator media files');
    }
}

// Example of fixing existing mismatched data
function fixExistingIdMismatch() {
    console.log('🔧 Fixing existing ID mismatches...');
    
    // Get all stored files
    const availableIds = JSON.parse(localStorage.getItem('vib3_availableFileIds') || '[]');
    const memoryFiles = window.creatorStudioFiles || {};
    
    console.log('Available IDs in localStorage:', availableIds);
    console.log('File IDs in memory:', Object.keys(memoryFiles));
    
    // Find mismatches
    const memoryIds = Object.keys(memoryFiles);
    const mismatches = [];
    
    availableIds.forEach(storageId => {
        if (!memoryFiles[storageId]) {
            // ID exists in localStorage but not in memory
            const savedData = localStorage.getItem(`vib3_media_${storageId}`);
            if (savedData) {
                mismatches.push({
                    type: 'missing_in_memory',
                    id: storageId,
                    data: JSON.parse(savedData)
                });
            }
        }
    });
    
    memoryIds.forEach(memoryId => {
        if (!availableIds.includes(memoryId)) {
            // File exists in memory but ID not in localStorage list
            mismatches.push({
                type: 'missing_in_storage',
                id: memoryId,
                data: memoryFiles[memoryId]
            });
        }
    });
    
    console.log('Found mismatches:', mismatches);
    
    // Fix mismatches
    mismatches.forEach(mismatch => {
        if (mismatch.type === 'missing_in_memory') {
            // Recreate in memory from localStorage
            window.creatorStudioFiles[mismatch.id] = {
                ...mismatch.data,
                id: mismatch.id,
                status: 'recovered'
            };
            console.log(`✅ Recovered file in memory: ${mismatch.id}`);
        } else if (mismatch.type === 'missing_in_storage') {
            // Add to localStorage
            const mediaData = {
                id: mismatch.id,
                name: mismatch.data.name,
                type: mismatch.data.type,
                size: mismatch.data.size,
                importedAt: mismatch.data.importedAt || Date.now()
            };
            
            localStorage.setItem(`vib3_media_${mismatch.id}`, JSON.stringify(mediaData));
            
            let availableIds = JSON.parse(localStorage.getItem('vib3_availableFileIds') || '[]');
            if (!availableIds.includes(mismatch.id)) {
                availableIds.push(mismatch.id);
                localStorage.setItem('vib3_availableFileIds', JSON.stringify(availableIds));
            }
            
            console.log(`✅ Added file to storage: ${mismatch.id}`);
        }
    });
    
    console.log('✅ ID mismatch fixing complete');
}

// Debug function to check current state
function debugCreatorMediaIds() {
    console.log('=== VIB3 Studio Debug Info ===');
    
    const availableIds = JSON.parse(localStorage.getItem('vib3_availableFileIds') || '[]');
    const memoryFiles = window.creatorStudioFiles || {};
    
    console.log('📋 Available File IDs (localStorage):', availableIds);
    console.log('🧠 Memory File IDs:', Object.keys(memoryFiles));
    
    // Check each localStorage entry
    availableIds.forEach(id => {
        const savedData = localStorage.getItem(`vib3_media_${id}`);
        const memoryFile = memoryFiles[id];
        
        console.log(`📁 File ID: ${id}`);
        console.log(`   └─ In localStorage: ${!!savedData}`);
        console.log(`   └─ In memory: ${!!memoryFile}`);
        
        if (savedData && memoryFile) {
            console.log(`   └─ ✅ Consistent`);
        } else {
            console.log(`   └─ ❌ MISMATCH!`);
        }
    });
    
    // Check for orphaned memory files
    Object.keys(memoryFiles).forEach(memoryId => {
        if (!availableIds.includes(memoryId)) {
            console.log(`🚨 Orphaned memory file: ${memoryId}`);
        }
    });
}

// Export functions to global scope
if (typeof window !== 'undefined') {
    window.fixImportCreatorMedia = fixImportCreatorMedia;
    window.fixExistingIdMismatch = fixExistingIdMismatch;
    window.debugCreatorMediaIds = debugCreatorMediaIds;
}