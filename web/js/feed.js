// Feed management module
import { db } from './firebase-init.js';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs,
    startAfter
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getCurrentUser, getUserData } from './auth.js';
import { incrementVideoView } from './video.js';
import { checkFollowStatus } from './user.js';
import { formatDate, formatNumber, debugLog, createSkeleton } from './utils.js';
import { appConfig } from './config.js';

// Video intersection observer for autoplay
let videoIntersectionObserver = null;
let lastVideoDoc = null;
let currentlyPlayingVideo = null;

// Initialize video intersection observer
export function initVideoObserver() {
    videoIntersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('.video-element');
            if (!video) return;
            
            if (entry.isIntersecting && entry.intersectionRatio > appConfig.videoIntersectionThreshold) {
                handleVideoIntersection(video, true);
            } else {
                handleVideoIntersection(video, false);
            }
        });
    }, {
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '-50px 0px -50px 0px'
    });
}

// Handle video intersection
function handleVideoIntersection(video, isIntersecting) {
    if (isIntersecting) {
        // Pause any other playing videos
        if (currentlyPlayingVideo && currentlyPlayingVideo !== video) {
            currentlyPlayingVideo.pause();
        }
        
        // Play this video
        video.muted = false;
        video.volume = 0.8;
        video.currentTime = 0;
        
        video.play().then(() => {
            currentlyPlayingVideo = video;
            // Increment view count
            const videoCard = video.closest('.video-card');
            const videoId = videoCard.getAttribute('data-video-id');
            if (videoId) {
                incrementVideoView(videoId);
            }
        }).catch(() => {
            // Fallback to muted autoplay if browser requires it
            video.muted = true;
            video.play().then(() => {
                currentlyPlayingVideo = video;
                debugLog('Playing with sound disabled due to browser policy');
            }).catch(() => {
                debugLog('Autoplay blocked - user can click to play');
            });
        });
    } else {
        if (!video.paused) {
            video.pause();
            if (currentlyPlayingVideo === video) {
                currentlyPlayingVideo = null;
            }
        }
    }
}

// Load video feed
export async function loadVideoFeed(feedType = 'foryou', resetFeed = true) {
    const videoFeed = document.getElementById('videoFeed');
    
    if (resetFeed) {
        videoFeed.innerHTML = '';
        lastVideoDoc = null;
        
        // Show loading skeletons
        createSkeleton(3).forEach(skeleton => {
            videoFeed.appendChild(skeleton);
        });
    }
    
    try {
        let videosQuery;
        
        switch (feedType) {
            case 'foryou':
                videosQuery = query(
                    collection(db, 'videos'),
                    where('status', '==', 'active'),
                    orderBy('createdAt', 'desc'),
                    limit(appConfig.feedPageSize)
                );
                break;
                
            case 'trending':
                // Get videos from last 7 days
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                videosQuery = query(
                    collection(db, 'videos'),
                    where('status', '==', 'active'),
                    where('createdAt', '>=', sevenDaysAgo),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
                break;
                
            case 'following':
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    showEmptyState('login');
                    return;
                }
                
                const userData = await getUserData(currentUser.uid);
                const following = userData?.following || [];
                
                if (following.length === 0) {
                    showEmptyState('noFollowing');
                    return;
                }
                
                videosQuery = query(
                    collection(db, 'videos'),
                    where('status', '==', 'active'),
                    where('userId', 'in', following),
                    orderBy('createdAt', 'desc'),
                    limit(appConfig.feedPageSize)
                );
                break;
                
            default:
                videosQuery = query(
                    collection(db, 'videos'),
                    where('status', '==', 'active'),
                    orderBy('createdAt', 'desc'),
                    limit(appConfig.feedPageSize)
                );
        }
        
        if (lastVideoDoc && !resetFeed) {
            videosQuery = query(videosQuery, startAfter(lastVideoDoc));
        }
        
        const querySnapshot = await getDocs(videosQuery);
        
        if (resetFeed) {
            videoFeed.innerHTML = '';
        }
        
        if (querySnapshot.empty && resetFeed) {
            showEmptyState(feedType === 'following' ? 'noFollowingVideos' : 'noVideos');
            return;
        }
        
        const videos = [];
        querySnapshot.forEach((doc) => {
            videos.push({ id: doc.id, ...doc.data() });
            lastVideoDoc = doc;
        });
        
        // For trending, sort by engagement
        if (feedType === 'trending') {
            videos.sort((a, b) => {
                const scoreA = (a.likes?.length || 0) + (a.comments?.length || 0) + (a.shares || 0);
                const scoreB = (b.likes?.length || 0) + (b.comments?.length || 0) + (b.shares || 0);
                return scoreB - scoreA;
            });
        }
        
        // Create video cards
        for (const videoData of videos) {
            const videoCard = await createVideoCard(videoData, feedType);
            videoFeed.appendChild(videoCard);
        }
        
        debugLog(`Loaded ${videos.length} videos for ${feedType} feed`);
        
    } catch (error) {
        console.error('Error loading video feed:', error);
        showErrorState(error);
    }
}

// Create video card element
async function createVideoCard(videoData, feedType) {
    const currentUser = getCurrentUser();
    const isOwner = currentUser && currentUser.uid === videoData.userId;
    const isLiked = currentUser && videoData.likes?.includes(currentUser.uid);
    const isFollowing = currentUser && await checkFollowStatus(videoData.userId);
    
    const card = document.createElement('div');
    card.className = 'video-card fade-in';
    card.setAttribute('data-video-id', videoData.id);
    
    // Get username from user data
    const userData = await getUserData(videoData.userId);
    const username = userData?.username || 'Anonymous';
    
    card.innerHTML = `
        <div class="video-wrapper" onclick="window.toggleVideoPlayback(this)">
            <div class="video-loading">Loading...</div>
            <video class="video-element" loop playsinline preload="metadata">
                <source src="${videoData.videoUrl}" type="video/mp4">
            </video>
            
            ${feedType === 'trending' ? `
                <div style="position: absolute; top: 15px; left: 15px; background: linear-gradient(45deg, #ff6b6b, #ffa500); color: white; padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; z-index: 5;">
                    🔥 Trending
                </div>
            ` : ''}
            
            ${feedType === 'following' ? `
                <div style="position: absolute; top: 15px; left: 15px; background: linear-gradient(45deg, #4ecdc4, #45b7d1); color: white; padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: bold; z-index: 5;">
                    👥 Following
                </div>
            ` : ''}
            
            <div class="video-overlay">
                <div class="video-user">
                    <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
                    <span class="username">@${username}</span>
                    ${!isOwner ? `
                        <button class="follow-btn ${isFollowing ? 'following' : ''}" 
                                onclick="event.stopPropagation(); window.handleFollowClick('${videoData.userId}', this)">
                            ${isFollowing ? 'Following' : 'Follow'}
                        </button>
                    ` : ''}
                </div>
                <p class="video-description">${videoData.description}</p>
                ${videoData.tags?.length > 0 ? `
                    <div class="video-tags">
                        ${videoData.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                    </div>
                ` : ''}
                <div class="video-actions">
                    <div class="action-group">
                        <button class="action-btn ${isLiked ? 'liked' : ''}" 
                                onclick="event.stopPropagation(); window.handleLikeClick('${videoData.id}', this)">
                            ❤️ <span>${formatNumber(videoData.likes?.length || 0)}</span>
                        </button>
                        <button class="action-btn" 
                                onclick="event.stopPropagation(); window.handleCommentClick('${videoData.id}')">
                            💬 <span>${formatNumber(videoData.comments?.length || 0)}</span>
                        </button>
                        <button class="action-btn" 
                                onclick="event.stopPropagation(); window.handleShareClick('${videoData.id}')">
                            📤 <span>${formatNumber(videoData.shares || 0)}</span>
                        </button>
                    </div>
                    <div class="video-info">
                        <span>👁️ ${formatNumber(videoData.views || 0)} views</span>
                        <span>• ${formatDate(videoData.createdAt)}</span>
                    </div>
                </div>
            </div>
            
            <div class="play-pause-indicator" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white; opacity: 0; transition: opacity 0.3s ease; pointer-events: none;">
                ▶️
            </div>
        </div>
    `;
    
    // Add styles for new elements
    const style = document.createElement('style');
    style.textContent = `
        .video-tags {
            margin: 10px 0;
        }
        .tag {
            display: inline-block;
            background: rgba(255,255,255,0.1);
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 12px;
            margin-right: 5px;
            color: #4ecdc4;
        }
        .video-info {
            display: flex;
            gap: 10px;
            font-size: 12px;
            color: rgba(255,255,255,0.7);
        }
        .follow-btn.following {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
        }
    `;
    if (!document.querySelector('#feedStyles')) {
        style.id = 'feedStyles';
        document.head.appendChild(style);
    }
    
    // Observe for autoplay
    if (videoIntersectionObserver) {
        videoIntersectionObserver.observe(card);
    }
    
    // Setup video event listeners
    const video = card.querySelector('.video-element');
    const loading = card.querySelector('.video-loading');
    
    video.addEventListener('loadstart', () => {
        loading.style.display = 'block';
    });
    
    video.addEventListener('canplay', () => {
        loading.style.display = 'none';
    });
    
    video.addEventListener('error', () => {
        loading.style.display = 'none';
        loading.textContent = 'Video unavailable';
    });
    
    return card;
}

// Show empty state
function showEmptyState(type) {
    const videoFeed = document.getElementById('videoFeed');
    videoFeed.innerHTML = '';
    
    const states = {
        noVideos: {
            icon: '📹',
            title: 'No videos yet!',
            message: 'Be the first to share something amazing.',
            button: 'Upload First Video',
            action: "window.openModal('uploadModal')"
        },
        noFollowing: {
            icon: '👥',
            title: 'No one followed yet!',
            message: 'Start following creators to see their videos here.',
            button: 'Discover Videos',
            action: "window.switchFeed('foryou')"
        },
        noFollowingVideos: {
            icon: '📱',
            title: 'No new videos!',
            message: 'People you follow haven\'t posted anything yet.',
            button: 'Browse All Videos',
            action: "window.switchFeed('foryou')"
        },
        login: {
            icon: '🔑',
            title: 'Login to see following!',
            message: 'Sign in to see videos from people you follow',
            button: 'Login',
            action: "window.openModal('loginModal')"
        }
    };
    
    const state = states[type] || states.noVideos;
    
    videoFeed.innerHTML = `
        <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.7);">
            <div style="font-size: 72px; margin-bottom: 30px;">${state.icon}</div>
            <h2 style="margin-bottom: 20px; font-size: 28px;">${state.title}</h2>
            <p style="font-size: 18px; margin-bottom: 30px; line-height: 1.5;">
                ${state.message}
            </p>
            <button class="btn btn-primary" onclick="${state.action}" style="padding: 15px 30px; font-size: 18px;">
                ${state.button}
            </button>
        </div>
    `;
}

// Show error state
function showErrorState(error) {
    const videoFeed = document.getElementById('videoFeed');
    videoFeed.innerHTML = `
        <div style="text-align: center; padding: 80px 20px; color: rgba(255,255,255,0.7);">
            <div style="font-size: 72px; margin-bottom: 30px;">⚠️</div>
            <h2 style="margin-bottom: 20px; font-size: 28px;">Unable to load videos</h2>
            <p style="font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
                ${error.message || 'There was a problem connecting to the server.'}
            </p>
            <button class="btn btn-secondary" onclick="window.loadVideoFeed()" style="padding: 15px 30px; font-size: 18px;">
                🔄 Try Again
            </button>
        </div>
    `;
}