// More Options Menu Handler
console.log('📋 More options handler loading...');

// Create the more options menu
function createMoreOptionsMenu() {
    const menu = document.createElement('div');
    menu.id = 'moreOptionsMenu';
    menu.className = 'more-options-menu';
    menu.style.cssText = `
        position: fixed;
        left: 240px;
        bottom: 80px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        padding: 8px 0;
        min-width: 200px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: none;
    `;
    
    const options = [
        { icon: '🎬', text: 'VIB3 Studio', action: 'showPage("creations")' },
        { icon: '🪙', text: 'VIB3 Coins', action: 'showPage("coins")' },
        { icon: '🛍️', text: 'Shop', action: 'showPage("shop")' },
        { icon: '⚙️', text: 'Settings', action: 'showPage("settings")' },
        { icon: '❓', text: 'Help', action: 'showPage("help")' },
        { divider: true },
        { icon: '📊', text: 'Analytics', action: 'showPage("analytics")' },
        { icon: '👥', text: 'Invite Friends', action: 'inviteFriends()' },
        { divider: true },
        { icon: '🚪', text: 'Log out', action: 'handleLogout()' }
    ];
    
    options.forEach(option => {
        if (option.divider) {
            const divider = document.createElement('div');
            divider.style.cssText = 'height: 1px; background: var(--border-primary); margin: 8px 0;';
            menu.appendChild(divider);
        } else {
            const item = document.createElement('button');
            item.className = 'more-option-item';
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                width: 100%;
                padding: 12px 16px;
                background: none;
                border: none;
                color: var(--text-primary);
                font-size: 16px;
                cursor: pointer;
                transition: background 0.2s;
                text-align: left;
            `;
            item.innerHTML = `
                <span style="font-size: 20px;">${option.icon}</span>
                <span>${option.text}</span>
            `;
            item.onclick = () => {
                eval(option.action);
                hideMoreOptions();
            };
            item.onmouseover = () => {
                item.style.background = 'var(--bg-tertiary)';
            };
            item.onmouseout = () => {
                item.style.background = 'none';
            };
            menu.appendChild(item);
        }
    });
    
    document.body.appendChild(menu);
    return menu;
}

// Show more options menu
window.showMoreOptions = function() {
    let menu = document.getElementById('moreOptionsMenu');
    if (!menu) {
        menu = createMoreOptionsMenu();
    }
    
    if (menu.style.display === 'block') {
        hideMoreOptions();
    } else {
        menu.style.display = 'block';
        
        // Add click outside to close
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);
    }
};

// Hide more options menu
function hideMoreOptions() {
    const menu = document.getElementById('moreOptionsMenu');
    if (menu) {
        menu.style.display = 'none';
    }
    document.removeEventListener('click', handleClickOutside);
}

// Handle click outside
function handleClickOutside(e) {
    const menu = document.getElementById('moreOptionsMenu');
    const moreButton = e.target.closest('.sidebar-item');
    
    if (menu && !menu.contains(e.target) && (!moreButton || !moreButton.onclick?.toString().includes('showMoreOptions'))) {
        hideMoreOptions();
    }
}

// Invite friends function
window.inviteFriends = function() {
    const shareUrl = window.location.origin;
    const message = `Join me on VIB3! 🎵 ${shareUrl}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Join VIB3',
            text: message,
            url: shareUrl
        }).catch(err => console.log('Share cancelled'));
    } else {
        // Copy to clipboard
        navigator.clipboard.writeText(message).then(() => {
            if (window.showNotification) {
                window.showNotification('Invite link copied! 📋', 'success');
            }
        });
    }
};

// Create VIB3 Coins page
function createCoinsPage() {
    const page = document.createElement('div');
    page.id = 'coins-page';
    page.className = 'coins-page';
    page.style.cssText = `
        display: none;
        margin-left: 240px;
        width: calc(100vw - 240px);
        height: 100vh;
        overflow-y: auto;
        background: var(--bg-primary);
        padding: 32px 40px;
    `;
    
    page.innerHTML = `
        <div style="max-width: 1200px; margin: 0 auto;">
            <h1 style="font-size: 48px; font-weight: 900; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 16px;">
                <span style="font-size: 56px;">🪙</span> VIB3 Coins
            </h1>
            <p style="font-size: 20px; color: var(--text-secondary); margin-bottom: 48px;">
                Earn coins by creating great content and engaging with the community!
            </p>
            
            <!-- Coin Balance -->
            <div style="background: linear-gradient(135deg, #ff006e, #8338ec); border-radius: 20px; padding: 40px; margin-bottom: 48px; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 20px; right: 20px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%; animation: float 6s ease-in-out infinite;"></div>
                <div style="position: absolute; bottom: -50px; left: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.08); border-radius: 50%; animation: float 8s ease-in-out infinite reverse;"></div>
                
                <h2 style="font-size: 24px; color: rgba(255,255,255,0.9); margin-bottom: 8px;">Your Balance</h2>
                <div style="font-size: 64px; font-weight: 900; color: white; margin-bottom: 16px;">
                    <span id="coinBalance">0</span> 🪙
                </div>
                <p style="color: rgba(255,255,255,0.8); font-size: 18px;">
                    ≈ $<span id="coinValue">0.00</span> USD
                </p>
            </div>
            
            <!-- Earn Coins Section -->
            <div style="margin-bottom: 48px;">
                <h2 style="font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px;">Earn Coins</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    <div class="coin-card" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 24px;">
                        <div style="font-size: 32px; margin-bottom: 12px;">📹</div>
                        <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Create Videos</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 12px;">Post original content</p>
                        <div style="font-size: 24px; font-weight: 700; color: #ff006e;">+50 🪙</div>
                    </div>
                    
                    <div class="coin-card" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 24px;">
                        <div style="font-size: 32px; margin-bottom: 12px;">❤️</div>
                        <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Get Likes</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 12px;">Every 100 likes</p>
                        <div style="font-size: 24px; font-weight: 700; color: #ff006e;">+10 🪙</div>
                    </div>
                    
                    <div class="coin-card" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 24px;">
                        <div style="font-size: 32px; margin-bottom: 12px;">🔄</div>
                        <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Daily Login</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 12px;">Come back every day</p>
                        <div style="font-size: 24px; font-weight: 700; color: #ff006e;">+5 🪙</div>
                    </div>
                    
                    <div class="coin-card" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 24px;">
                        <div style="font-size: 32px; margin-bottom: 12px;">🎬</div>
                        <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Go Live</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 12px;">Stream for 10+ mins</p>
                        <div style="font-size: 24px; font-weight: 700; color: #ff006e;">+100 🪙</div>
                    </div>
                </div>
            </div>
            
            <!-- Spend Coins Section -->
            <div>
                <h2 style="font-size: 32px; font-weight: 700; color: var(--text-primary); margin-bottom: 24px;">Spend Coins</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                    <div class="coin-card" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 24px;">
                        <div style="font-size: 32px; margin-bottom: 12px;">🎁</div>
                        <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Send Gifts</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 12px;">Support creators</p>
                        <button style="width: 100%; padding: 12px; background: #ff006e; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">Shop Gifts</button>
                    </div>
                    
                    <div class="coin-card" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 24px;">
                        <div style="font-size: 32px; margin-bottom: 12px;">🚀</div>
                        <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Boost Posts</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 12px;">Increase visibility</p>
                        <button style="width: 100%; padding: 12px; background: #8338ec; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">Learn More</button>
                    </div>
                    
                    <div class="coin-card" style="background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 16px; padding: 24px;">
                        <div style="font-size: 32px; margin-bottom: 12px;">💎</div>
                        <h3 style="font-size: 20px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">VIB3 Premium</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 12px;">Unlock features</p>
                        <button style="width: 100%; padding: 12px; background: linear-gradient(45deg, #ff006e, #8338ec); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">Coming Soon</button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            .coin-card {
                transition: all 0.3s ease;
            }
            
            .coin-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.1);
            }
            
            .coin-card button:hover {
                filter: brightness(1.1);
                transform: translateY(-1px);
            }
        </style>
    `;
    
    document.querySelector('.app-container').appendChild(page);
    
    // Initialize coin balance
    updateCoinBalance();
}

// Update coin balance
function updateCoinBalance() {
    const balance = localStorage.getItem('vib3_coins') || '0';
    const balanceNum = parseInt(balance);
    const value = (balanceNum * 0.01).toFixed(2); // 1 coin = $0.01
    
    const balanceEl = document.getElementById('coinBalance');
    const valueEl = document.getElementById('coinValue');
    
    if (balanceEl) balanceEl.textContent = balanceNum.toLocaleString();
    if (valueEl) valueEl.textContent = value;
}

// Initialize coins page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    createCoinsPage();
});

console.log('✅ More options handler ready');