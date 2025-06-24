// Search functionality module
import { db } from './firebase-init.js';
import { 
    collection, 
    query, 
    where, 
    getDocs,
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { searchUsers } from './user.js';
import { debounce, showLoader, hideLoader } from './utils.js';

let searchResultsContainer = null;
let currentSearchQuery = '';

// Initialize search
export function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    // Create search results container
    createSearchResultsContainer();
    
    // Add search event listener with debounce
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Handle focus/blur
    searchInput.addEventListener('focus', () => {
        if (currentSearchQuery.length >= 2) {
            showSearchResults();
        }
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar') && !e.target.closest('#searchResults')) {
            hideSearchResults();
        }
    });
}

// Create search results container
function createSearchResultsContainer() {
    const searchBar = document.querySelector('.search-bar');
    if (!searchBar) return;
    
    searchResultsContainer = document.createElement('div');
    searchResultsContainer.id = 'searchResults';
    searchResultsContainer.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.95);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 15px;
        margin-top: 10px;
        max-height: 400px;
        overflow-y: auto;
        display: none;
        z-index: 1000;
        backdrop-filter: blur(10px);
    `;
    
    searchBar.appendChild(searchResultsContainer);
}

// Handle search input
async function handleSearch(e) {
    currentSearchQuery = e.target.value.trim();
    
    if (currentSearchQuery.length < 2) {
        hideSearchResults();
        return;
    }
    
    showSearchResults();
    const loader = showLoader(searchResultsContainer, 'Searching...');
    
    try {
        // Search for users and videos in parallel
        const [users, videos] = await Promise.all([
            searchUsers(currentSearchQuery),
            searchVideos(currentSearchQuery)
        ]);
        
        hideLoader(loader);
        displaySearchResults(users, videos);
        
    } catch (error) {
        console.error('Search error:', error);
        hideLoader(loader);
        searchResultsContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7);">
                <p>Error performing search</p>
            </div>
        `;
    }
}

// Search videos
async function searchVideos(searchQuery) {
    try {
        // Search in descriptions and tags
        const videosSnapshot = await getDocs(collection(db, 'videos'));
        const videos = [];
        
        videosSnapshot.forEach(doc => {
            const videoData = doc.data();
            const description = (videoData.description || '').toLowerCase();
            const tags = (videoData.tags || []).map(tag => tag.toLowerCase());
            const query = searchQuery.toLowerCase();
            
            if (description.includes(query) || 
                tags.some(tag => tag.includes(query))) {
                videos.push({ id: doc.id, ...videoData });
            }
        });
        
        // Sort by relevance (simple scoring)
        videos.sort((a, b) => {
            const scoreA = calculateRelevanceScore(a, searchQuery);
            const scoreB = calculateRelevanceScore(b, searchQuery);
            return scoreB - scoreA;
        });
        
        return videos.slice(0, 10); // Return top 10 results
    } catch (error) {
        console.error('Error searching videos:', error);
        return [];
    }
}

// Calculate relevance score for search results
function calculateRelevanceScore(video, searchQuery) {
    const query = searchQuery.toLowerCase();
    let score = 0;
    
    // Description match
    const description = (video.description || '').toLowerCase();
    if (description.includes(query)) {
        score += description.startsWith(query) ? 10 : 5;
    }
    
    // Tag match
    const tags = (video.tags || []).map(tag => tag.toLowerCase());
    tags.forEach(tag => {
        if (tag === query) score += 15;
        else if (tag.includes(query)) score += 7;
    });
    
    // Engagement score
    score += (video.likes?.length || 0) * 0.1;
    score += (video.comments?.length || 0) * 0.05;
    score += (video.views || 0) * 0.001;
    
    return score;
}

// Display search results
function displaySearchResults(users, videos) {
    if (users.length === 0 && videos.length === 0) {
        searchResultsContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.7);">
                <p>No results found for "${currentSearchQuery}"</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Display users
    if (users.length > 0) {
        html += `
            <div style="padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <h4 style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Users</h4>
            </div>
        `;
        
        users.forEach(user => {
            html += `
                <div class="search-result-item" onclick="window.viewUserProfile('${user.uid}')" style="padding: 15px 20px; cursor: pointer; transition: background 0.3s ease;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600;">@${user.username}</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.6);">
                                ${user.followers?.length || 0} followers
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // Display videos
    if (videos.length > 0) {
        html += `
            <div style="padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); ${users.length > 0 ? 'border-top: 1px solid rgba(255,255,255,0.1);' : ''}">
                <h4 style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Videos</h4>
            </div>
        `;
        
        videos.forEach(video => {
            const description = video.description || 'No description';
            const truncatedDesc = description.length > 60 ? 
                description.substring(0, 60) + '...' : description;
            
            html += `
                <div class="search-result-item" onclick="window.playVideo('${video.id}')" style="padding: 15px 20px; cursor: pointer; transition: background 0.3s ease;">
                    <div style="display: flex; gap: 15px;">
                        <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden;">
                            <video style="width: 100%; height: 100%; object-fit: cover;" muted>
                                <source src="${video.videoUrl}" type="video/mp4">
                            </video>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; margin-bottom: 5px;">${truncatedDesc}</div>
                            <div style="font-size: 12px; color: rgba(255,255,255,0.6);">
                                ❤️ ${video.likes?.length || 0} • 👁️ ${video.views || 0} views
                            </div>
                            ${video.tags?.length > 0 ? `
                                <div style="margin-top: 5px;">
                                    ${video.tags.slice(0, 3).map(tag => `
                                        <span style="display: inline-block; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-right: 5px; color: #4ecdc4;">
                                            ${tag}
                                        </span>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    searchResultsContainer.innerHTML = html;
    
    // Add hover effect
    const items = searchResultsContainer.querySelectorAll('.search-result-item');
    items.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.background = 'rgba(255,255,255,0.1)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
        });
    });
}

// Show search results
function showSearchResults() {
    if (searchResultsContainer) {
        searchResultsContainer.style.display = 'block';
    }
}

// Hide search results
function hideSearchResults() {
    if (searchResultsContainer) {
        searchResultsContainer.style.display = 'none';
    }
}

// Clear search
export function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        currentSearchQuery = '';
    }
    hideSearchResults();
}