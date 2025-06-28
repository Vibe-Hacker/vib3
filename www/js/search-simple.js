// Simple search functions for VIB3

let searchModal = null;
let searchCache = new Map();
let isSearching = false;

// Create search modal HTML
function createSearchModal() {
    if (searchModal) return searchModal;
    
    const modal = document.createElement('div');
    modal.id = 'searchModal';
    modal.className = 'search-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        z-index: 10001;
        display: none;
        justify-content: center;
        align-items: flex-start;
        padding-top: 60px;
    `;
    
    modal.innerHTML = `
        <div class="search-container" style="
            background: #161823;
            width: 100%;
            max-width: 600px;
            max-height: 80vh;
            border-radius: 20px;
            display: flex;
            flex-direction: column;
            color: white;
            margin: 0 20px;
        ">
            <!-- Header -->
            <div class="search-header" style="
                padding: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                gap: 15px;
                align-items: center;
            ">
                <input type="text" class="search-input" placeholder="Search users, videos, hashtags..." style="
                    flex: 1;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 25px;
                    padding: 12px 20px;
                    color: white;
                    font-size: 16px;
                " maxlength="100">
                <button class="close-search" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 5px;
                    width: 35px;
                    height: 35px;
                ">&times;</button>
            </div>
            
            <!-- Filter Tabs -->
            <div class="search-tabs" style="
                display: flex;
                padding: 15px 20px 0;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            ">
                <button class="search-tab active" data-type="all" style="
                    padding: 10px 20px;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    border-bottom: 2px solid #fe2c55;
                    margin-right: 20px;
                ">All</button>
                <button class="search-tab" data-type="users" style="
                    padding: 10px 20px;
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.6);
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    margin-right: 20px;
                ">Users</button>
                <button class="search-tab" data-type="videos" style="
                    padding: 10px 20px;
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.6);
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    margin-right: 20px;
                ">Videos</button>
                <button class="search-tab" data-type="hashtags" style="
                    padding: 10px 20px;
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.6);
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                ">Hashtags</button>
            </div>
            
            <!-- Search Results -->
            <div class="search-results" style="
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                max-height: 60vh;
            ">
                <div class="search-placeholder" style="
                    text-align: center;
                    color: rgba(255,255,255,0.6);
                    padding: 40px;
                ">
                    <div style="font-size: 40px; margin-bottom: 15px;">🔍</div>
                    <h3 style="margin: 0 0 10px 0;">Start searching</h3>
                    <p style="margin: 0; font-size: 14px;">Type to find users, videos, and hashtags</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    searchModal = modal;
    
    // Add event listeners
    setupSearchEventListeners();
    
    return modal;
}

// Setup event listeners for search modal
function setupSearchEventListeners() {
    if (!searchModal) return;
    
    const closeBtn = searchModal.querySelector('.close-search');
    const searchInput = searchModal.querySelector('.search-input');
    const searchTabs = searchModal.querySelectorAll('.search-tab');
    
    // Close modal
    closeBtn.addEventListener('click', closeSearchModal);
    
    // Click outside to close
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            closeSearchModal();
        }
    });
    
    // Search input
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length === 0) {
            showSearchPlaceholder();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearchQuery(query);
        }, 300); // Debounce 300ms
    });
    
    // Tab switching
    searchTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            searchTabs.forEach(t => {
                t.classList.remove('active');
                t.style.color = 'rgba(255,255,255,0.6)';
                t.style.borderBottom = '2px solid transparent';
            });
            
            tab.classList.add('active');
            tab.style.color = 'white';
            tab.style.borderBottom = '2px solid #fe2c55';
            
            // Re-run search with filter
            const query = searchInput.value.trim();
            if (query) {
                performSearchQuery(query, tab.dataset.type);
            }
        });
    });
}

// Open search modal
function openSearchModal() {
    console.log('🔍 Opening search modal');
    
    if (!searchModal) {
        createSearchModal();
    }
    
    // Show modal
    searchModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus input
    setTimeout(() => {
        const input = searchModal.querySelector('.search-input');
        if (input) input.focus();
    }, 100);
}

// Close search modal
function closeSearchModal() {
    if (!searchModal) return;
    
    searchModal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Clear search
    const input = searchModal.querySelector('.search-input');
    if (input) input.value = '';
    showSearchPlaceholder();
    
    console.log('🔍 Search modal closed');
}

// Show search placeholder
function showSearchPlaceholder() {
    const resultsContainer = searchModal.querySelector('.search-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = `
        <div class="search-placeholder" style="
            text-align: center;
            color: rgba(255,255,255,0.6);
            padding: 40px;
        ">
            <div style="font-size: 40px; margin-bottom: 15px;">🔍</div>
            <h3 style="margin: 0 0 10px 0;">Start searching</h3>
            <p style="margin: 0; font-size: 14px;">Type to find users, videos, and hashtags</p>
        </div>
    `;
}

// Perform search query
async function performSearchQuery(query, filter = 'all') {
    if (isSearching) return;
    isSearching = true;
    
    const resultsContainer = searchModal.querySelector('.search-results');
    if (!resultsContainer) return;
    
    // Show loading
    resultsContainer.innerHTML = `
        <div class="search-loading" style="
            text-align: center;
            color: rgba(255,255,255,0.6);
            padding: 40px;
        ">
            <div style="font-size: 20px; margin-bottom: 10px;">🔍</div>
            Searching for "${query}"...
        </div>
    `;
    
    try {
        // Check cache first
        const cacheKey = `${query}_${filter}`;
        if (searchCache.has(cacheKey)) {
            const cachedResults = searchCache.get(cacheKey);
            displaySearchResults(cachedResults, query, filter);
            isSearching = false;
            return;
        }
        
        // Try to fetch from API
        const response = await fetch(`${window.API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&type=${filter}`);
        
        if (response.ok) {
            const data = await response.json();
            searchCache.set(cacheKey, data);
            displaySearchResults(data, query, filter);
        } else {
            // Fallback to mock results
            setTimeout(() => {
                const mockResults = generateMockSearchResults(query, filter);
                searchCache.set(cacheKey, mockResults);
                displaySearchResults(mockResults, query, filter);
            }, 500);
        }
        
    } catch (error) {
        console.error('Search error:', error);
        
        // Show mock results on error
        const mockResults = generateMockSearchResults(query, filter);
        displaySearchResults(mockResults, query, filter);
    }
    
    isSearching = false;
}

// Generate mock search results
function generateMockSearchResults(query, filter) {
    const mockUsers = [
        { id: 'user1', username: 'dancer_queen', name: 'Dance Queen', followers: '2.1M', avatar: '💃', verified: true },
        { id: 'user2', username: 'music_lover', name: 'Music Lover', followers: '890K', avatar: '🎵', verified: false },
        { id: 'user3', username: 'funny_guy', name: 'Comedy Central', followers: '1.5M', avatar: '😂', verified: true },
        { id: 'user4', username: 'artist_pro', name: 'Pro Artist', followers: '3.2M', avatar: '🎨', verified: true }
    ];
    
    const mockVideos = [
        { id: 'vid1', title: 'Amazing dance moves!', creator: 'dancer_queen', views: '1.2M', likes: '89K', thumbnail: '🕺' },
        { id: 'vid2', title: 'Funny cat compilation', creator: 'funny_guy', views: '2.8M', likes: '156K', thumbnail: '🐱' },
        { id: 'vid3', title: 'New music video', creator: 'music_lover', views: '980K', likes: '67K', thumbnail: '🎤' },
        { id: 'vid4', title: 'Art tutorial', creator: 'artist_pro', views: '456K', likes: '34K', thumbnail: '🖼️' }
    ];
    
    const mockHashtags = [
        { tag: 'dance', videos: '5.2M', trending: true },
        { tag: 'funny', videos: '8.9M', trending: true },
        { tag: 'music', videos: '12.1M', trending: false },
        { tag: 'viral', videos: '15.6M', trending: true },
        { tag: 'trending', videos: '23.4M', trending: true }
    ];
    
    // Filter results based on query
    const queryLower = query.toLowerCase();
    
    let filteredUsers = mockUsers.filter(user => 
        user.username.toLowerCase().includes(queryLower) || 
        user.name.toLowerCase().includes(queryLower)
    );
    
    let filteredVideos = mockVideos.filter(video => 
        video.title.toLowerCase().includes(queryLower) ||
        video.creator.toLowerCase().includes(queryLower)
    );
    
    let filteredHashtags = mockHashtags.filter(hashtag => 
        hashtag.tag.toLowerCase().includes(queryLower)
    );
    
    // Apply type filter
    const results = { users: [], videos: [], hashtags: [] };
    
    if (filter === 'all' || filter === 'users') {
        results.users = filteredUsers.slice(0, 10);
    }
    if (filter === 'all' || filter === 'videos') {
        results.videos = filteredVideos.slice(0, 10);
    }
    if (filter === 'all' || filter === 'hashtags') {
        results.hashtags = filteredHashtags.slice(0, 10);
    }
    
    return results;
}

// Display search results
function displaySearchResults(results, query, filter) {
    const resultsContainer = searchModal.querySelector('.search-results');
    if (!resultsContainer) return;
    
    const totalResults = (results.users?.length || 0) + (results.videos?.length || 0) + (results.hashtags?.length || 0);
    
    if (totalResults === 0) {
        resultsContainer.innerHTML = `
            <div style="
                text-align: center;
                color: rgba(255,255,255,0.6);
                padding: 40px;
            ">
                <div style="font-size: 40px; margin-bottom: 15px;">😕</div>
                <h3 style="margin: 0 0 10px 0;">No results found</h3>
                <p style="margin: 0; font-size: 14px;">Try a different search term</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Users section
    if (results.users && results.users.length > 0) {
        html += `<div class="search-section">
            <h4 style="margin: 0 0 15px 0; font-size: 16px; color: rgba(255,255,255,0.8);">Users</h4>`;
        
        results.users.forEach(user => {
            html += `
                <div class="search-result-item" onclick="viewUserProfile('${user.id}')" style="
                    display: flex;
                    align-items: center;
                    padding: 12px 0;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                ">
                    <div class="user-avatar" style="
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        background: linear-gradient(45deg, #fe2c55, #8338ec);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        margin-right: 12px;
                    ">${user.avatar}</div>
                    <div class="user-info" style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span style="font-weight: 600; color: white;">@${user.username}</span>
                            ${user.verified ? '<span style="color: #20d5ec;">✓</span>' : ''}
                        </div>
                        <div style="font-size: 14px; color: rgba(255,255,255,0.6);">${user.name}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.4);">${user.followers} followers</div>
                    </div>
                    <button style="
                        background: #fe2c55;
                        border: none;
                        border-radius: 20px;
                        color: white;
                        padding: 8px 16px;
                        font-size: 14px;
                        cursor: pointer;
                    ">Follow</button>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Videos section
    if (results.videos && results.videos.length > 0) {
        html += `<div class="search-section" style="margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; font-size: 16px; color: rgba(255,255,255,0.8);">Videos</h4>`;
        
        results.videos.forEach(video => {
            html += `
                <div class="search-result-item" onclick="playSearchVideo('${video.id}')" style="
                    display: flex;
                    align-items: center;
                    padding: 12px 0;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                ">
                    <div class="video-thumbnail" style="
                        width: 60px;
                        height: 60px;
                        border-radius: 8px;
                        background: rgba(255,255,255,0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                        margin-right: 12px;
                    ">${video.thumbnail}</div>
                    <div class="video-info" style="flex: 1;">
                        <div style="font-weight: 600; color: white; margin-bottom: 4px;">${video.title}</div>
                        <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 2px;">@${video.creator}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.4);">${video.views} views • ${video.likes} likes</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Hashtags section
    if (results.hashtags && results.hashtags.length > 0) {
        html += `<div class="search-section" style="margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; font-size: 16px; color: rgba(255,255,255,0.8);">Hashtags</h4>`;
        
        results.hashtags.forEach(hashtag => {
            html += `
                <div class="search-result-item" onclick="searchHashtag('${hashtag.tag}')" style="
                    display: flex;
                    align-items: center;
                    padding: 12px 0;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                ">
                    <div class="hashtag-icon" style="
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        background: rgba(255,255,255,0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                        margin-right: 12px;
                        color: #fe2c55;
                    ">#</div>
                    <div class="hashtag-info" style="flex: 1;">
                        <div style="font-weight: 600; color: white;">#${hashtag.tag}</div>
                        <div style="font-size: 14px; color: rgba(255,255,255,0.6);">${hashtag.videos} videos</div>
                    </div>
                    ${hashtag.trending ? '<div style="background: #fe2c55; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">Trending</div>' : ''}
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    resultsContainer.innerHTML = html;
    console.log(`🔍 Displayed ${totalResults} search results for "${query}"`);
}

// Handle search from sidebar/navigation
function performSearch(query) {
    openSearchModal();
    
    // Set the search input and trigger search
    setTimeout(() => {
        const input = searchModal.querySelector('.search-input');
        if (input) {
            input.value = query;
            performSearchQuery(query);
        }
    }, 100);
}

// Search result actions
function viewUserProfile(userId) {
    closeSearchModal();
    if (window.showNotification) {
        window.showNotification('Opening user profile...', 'info');
    }
    console.log('👤 Opening profile for user:', userId);
}

function playSearchVideo(videoId) {
    closeSearchModal();
    if (window.showNotification) {
        window.showNotification('Playing video...', 'info');
    }
    console.log('▶️ Playing video:', videoId);
}

function searchHashtag(tag) {
    if (window.showNotification) {
        window.showNotification(`Searching hashtag #${tag}...`, 'info');
    }
    
    // Update search input and perform new search
    const input = searchModal.querySelector('.search-input');
    if (input) {
        input.value = `#${tag}`;
        performSearchQuery(`#${tag}`);
    }
    
    console.log('🏷️ Searching hashtag:', tag);
}

// Initialize search
function initSearch() {
    createSearchModal();
    console.log('🔍 Search system initialized');
}

// Make functions globally available
window.performSearch = performSearch;
window.openSearchModal = openSearchModal;
window.closeSearchModal = closeSearchModal;
window.initSearch = initSearch;
window.viewUserProfile = viewUserProfile;
window.playSearchVideo = playSearchVideo;
window.searchHashtag = searchHashtag;