// Upload Modal Handler
console.log('📤 Upload modal handler loading...');

// Show upload modal function
window.showUploadModal = function() {
    console.log('📤 Opening upload modal...');
    
    // Check if modal already exists
    let modal = document.getElementById('uploadModal');
    if (!modal) {
        modal = createUploadModal();
    }
    
    // Show the modal
    modal.style.display = 'flex';
    
    // Reset form
    const form = modal.querySelector('form');
    if (form) form.reset();
    
    // Focus on file input
    const fileInput = modal.querySelector('#uploadVideoFile');
    if (fileInput) {
        setTimeout(() => fileInput.click(), 100);
    }
};

// Create upload modal
function createUploadModal() {
    const modal = document.createElement('div');
    modal.id = 'uploadModal';
    modal.className = 'upload-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div class="upload-modal-content" style="background: var(--bg-secondary); border-radius: 16px; padding: 32px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="font-size: 28px; font-weight: 700; color: var(--text-primary); margin: 0;">Upload Video</h2>
                <button onclick="closeUploadModal()" style="background: none; border: none; font-size: 32px; color: var(--text-secondary); cursor: pointer;">&times;</button>
            </div>
            
            <form id="uploadForm" onsubmit="handleVideoUpload(event)">
                <!-- File Upload Area -->
                <div id="uploadDropZone" style="border: 2px dashed var(--border-primary); border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 24px; cursor: pointer;" onclick="document.getElementById('uploadVideoFile').click()">
                    <div style="font-size: 48px; margin-bottom: 16px;">📹</div>
                    <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Select video to upload</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 16px;">Or drag and drop a video file</p>
                    <button type="button" style="padding: 12px 24px; background: var(--accent-primary); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">Choose File</button>
                    <input type="file" id="uploadVideoFile" accept="video/*" style="display: none;" onchange="handleFileSelect(event)" required>
                </div>
                
                <!-- Video Preview -->
                <div id="uploadPreview" style="display: none; margin-bottom: 24px;">
                    <video id="uploadPreviewVideo" style="width: 100%; max-height: 300px; border-radius: 8px;" controls></video>
                </div>
                
                <!-- Video Details -->
                <div id="uploadDetails" style="display: none;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Caption</label>
                        <textarea id="uploadCaption" placeholder="Write a caption..." style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); font-size: 16px; resize: vertical; min-height: 80px;"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Hashtags</label>
                        <input type="text" id="uploadTags" placeholder="#dance #music #viral" style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); font-size: 16px;">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: var(--text-primary);">Privacy</label>
                        <select id="uploadPrivacy" style="width: 100%; padding: 12px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-tertiary); color: var(--text-primary); font-size: 16px;">
                            <option value="public">Public</option>
                            <option value="friends">Friends Only</option>
                            <option value="private">Private</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; gap: 12px;">
                        <button type="button" onclick="closeUploadModal()" style="flex: 1; padding: 14px; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-primary); border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">Cancel</button>
                        <button type="submit" style="flex: 1; padding: 14px; background: var(--accent-primary); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">Upload</button>
                    </div>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add drag and drop functionality
    const dropZone = modal.querySelector('#uploadDropZone');
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent-primary)';
        dropZone.style.background = 'rgba(254, 44, 85, 0.1)';
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-primary)';
        dropZone.style.background = 'transparent';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--border-primary)';
        dropZone.style.background = 'transparent';
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('video/')) {
            const fileInput = modal.querySelector('#uploadVideoFile');
            fileInput.files = files;
            handleFileSelect({ target: fileInput });
        }
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeUploadModal();
        }
    });
    
    return modal;
}

// Handle file selection
window.handleFileSelect = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('📹 File selected:', file.name, file.size, file.type);
    
    // Show preview
    const preview = document.getElementById('uploadPreview');
    const previewVideo = document.getElementById('uploadPreviewVideo');
    const dropZone = document.getElementById('uploadDropZone');
    const details = document.getElementById('uploadDetails');
    
    if (preview && previewVideo) {
        const url = URL.createObjectURL(file);
        previewVideo.src = url;
        preview.style.display = 'block';
        dropZone.style.display = 'none';
        details.style.display = 'block';
    }
};

// Close upload modal
window.closeUploadModal = function() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Clean up preview
        const previewVideo = document.getElementById('uploadPreviewVideo');
        if (previewVideo && previewVideo.src) {
            URL.revokeObjectURL(previewVideo.src);
            previewVideo.src = '';
        }
    }
};

// Handle video upload
window.handleVideoUpload = async function(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('uploadVideoFile');
    const caption = document.getElementById('uploadCaption').value;
    const tags = document.getElementById('uploadTags').value;
    const privacy = document.getElementById('uploadPrivacy').value;
    
    if (!fileInput.files[0]) {
        if (window.showNotification) {
            window.showNotification('Please select a video file', 'error');
        }
        return;
    }
    
    console.log('📤 Uploading video...', {
        file: fileInput.files[0].name,
        caption,
        tags,
        privacy
    });
    
    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Uploading...';
    submitButton.disabled = true;
    
    try {
        // TODO: Implement actual upload logic here
        // For now, just simulate upload
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (window.showNotification) {
            window.showNotification('Video uploaded successfully! 🎉', 'success');
        }
        
        closeUploadModal();
        
        // Refresh feed if available
        if (window.loadFeedVideos) {
            window.loadFeedVideos('foryou');
        }
    } catch (error) {
        console.error('Upload error:', error);
        if (window.showNotification) {
            window.showNotification('Upload failed. Please try again.', 'error');
        }
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
};

console.log('✅ Upload modal handler ready');