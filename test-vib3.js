// VIB3 Automated Testing & Bug Detection
// This script simulates user interactions to find and fix issues

const testSuite = {
    // Test all sidebar navigation
    testNavigation: function() {
        const navButtons = [
            'foryou', 'explore', 'following', 'friends', 'activity', 
            'messages', 'live', 'profile', 'creator', 'shop', 'analytics'
        ];
        
        console.log('Testing navigation...');
        navButtons.forEach(page => {
            try {
                if (window.showPage) {
                    window.showPage(page);
                    console.log(`✓ ${page} page loaded`);
                } else {
                    console.error(`✗ showPage function missing`);
                }
            } catch (error) {
                console.error(`✗ ${page} navigation failed:`, error.message);
            }
        });
    },

    // Test all button functions exist
    testFunctions: function() {
        const criticalFunctions = [
            'handleLogin', 'handleSignup', 'handleLogout',
            'toggleVideoPlayback', 'openCommentsModal', 'openShareModal',
            'viewProfile', 'saveVideo', 'addEffect', 'applyFilter',
            'recordVideo', 'startDuet', 'startStitch', 'changeTheme'
        ];
        
        console.log('Testing critical functions...');
        criticalFunctions.forEach(func => {
            if (typeof window[func] === 'function') {
                console.log(`✓ ${func} exists`);
            } else {
                console.error(`✗ ${func} missing or not global`);
            }
        });
    },

    // Test modal creation and cleanup
    testModals: function() {
        console.log('Testing modal functionality...');
        
        // Test comment modal
        if (window.openCommentsModal) {
            window.openCommentsModal('test123');
            const modal = document.querySelector('.comments-modal');
            if (modal) {
                console.log('✓ Comment modal created');
                modal.remove();
                console.log('✓ Comment modal cleaned up');
            } else {
                console.error('✗ Comment modal not created');
            }
        }

        // Test share modal
        if (window.openShareModal) {
            window.openShareModal('test123');
            const shareModal = document.querySelector('.share-modal');
            if (shareModal) {
                console.log('✓ Share modal created');
                shareModal.remove();
                console.log('✓ Share modal cleaned up');
            } else {
                console.error('✗ Share modal not created');
            }
        }
    },

    // Test theme switching
    testThemes: function() {
        const themes = ['light', 'dark', 'purple', 'blue', 'green', 'rose'];
        console.log('Testing theme switching...');
        
        themes.forEach(theme => {
            if (window.changeTheme) {
                window.changeTheme(theme);
                const bodyClass = document.body.className;
                if (bodyClass.includes(`theme-${theme}`)) {
                    console.log(`✓ ${theme} theme applied`);
                } else {
                    console.error(`✗ ${theme} theme not applied`);
                }
            }
        });
    },

    // Test search functionality
    testSearch: function() {
        console.log('Testing search...');
        if (window.performSearch) {
            window.performSearch('test query');
            const searchPage = document.getElementById('searchPage');
            if (searchPage && searchPage.style.display !== 'none') {
                console.log('✓ Search navigation works');
            } else {
                console.error('✗ Search navigation failed');
            }
        }
    },

    // Run all tests
    runAll: function() {
        console.log('🧪 Starting VIB3 Test Suite...');
        this.testFunctions();
        this.testNavigation();
        this.testModals();
        this.testThemes();
        this.testSearch();
        console.log('🏁 Test Suite Complete');
    }
};

// Auto-run tests when included
if (typeof window !== 'undefined') {
    // Wait for DOM and app to load
    setTimeout(() => {
        testSuite.runAll();
    }, 2000);
}

// Export for manual testing
if (typeof module !== 'undefined') {
    module.exports = testSuite;
}