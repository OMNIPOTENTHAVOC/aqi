document.addEventListener('DOMContentLoaded', function() {
    // Global state to store AQI data and logs
    let aqiHistory = JSON.parse(localStorage.getItem('aqiHistory')) || [];
    let currentAqiData = null;

    // Theme toggle
    const themeSwitch = document.getElementById('theme-switch');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    themeSwitch.checked = currentTheme === 'dark';
    
    themeSwitch.addEventListener('change', function() {
        const theme = this.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });

    // Sidebar functionality
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobile-menu-btn');
    const closeBtn = document.getElementById('close-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    function openSidebar() {
        sidebar.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    
    function closeSidebar() {
        sidebar.classList.remove('open');
        document.body.style.overflow = 'auto';
    }
    
    menuBtn.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    
    // Close sidebar on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    // Page Navigation System
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    
    function showPage(pageId) {
        // Hide all pages
        pages.forEach(page => page.classList.remove('active'));
        
        // Show selected page
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Update active nav item
        navItems.forEach(item => item.classList.remove('active'));
        const activeNav = document.querySelector(`[data-page="${pageId}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
        
        // Close sidebar after navigation
        closeSidebar();
    }
    
    // Handle navigation clicks
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
        });
    });

    // Store AQI data in history
    function storeAqiData(aqi, status) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp: timestamp,
            aqi: aqi,
            status: status,
            location: "SRM Institute of Science and Technology, Kattankulathur" // You can change this
        };
        
        aqiHistory.push(logEntry);
        
        // Keep only last 100 entries
        if (aqiHistory.length > 100) {
            aqiHistory = aqiHistory.slice(-100);
        }
        
        localStorage.setItem('aqiHistory', JSON.stringify(aqiHistory));
        currentAqiData = logEntry;
    }

    // Generate improvement content based on AQI level
    function generateImprovementContent(aqi) {
        const improvementSection = document.getElementById('improvement-section');
        const improvementTitle = document.getElementById('improvement-title');
        const improvementBadge = document.getElementById('improvement-badge');
        const improvementContent = document.getElementById('improvement-content');
        
        let title, badge, content;
        
        if (aqi <= 50) {
            // Good air quality - show general tips
            title = "Maintain Good Air Quality";
            badge = "Keep It Up!";
            content = `
                <div class="improvement-grid">
                    <div class="improvement-section">
                        <h4><i class="fas fa-leaf"></i> Maintain Clean Air</h4>
                        <div class="improvement-list">
                            <div class="improvement-item">
                                <i class="fas fa-seedling"></i>
                                <div class="improvement-text">
                                    <h5>Continue Green Practices</h5>
                                    <p>Keep using public transport and eco-friendly habits</p>
                                </div>
                            </div>
                            <div class="improvement-item">
                                <i class="fas fa-bicycle"></i>
                                <div class="improvement-text">
                                    <h5>Outdoor Activities</h5>
                                    <p>Perfect time for outdoor exercise and activities</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (aqi <= 100) {
            // Moderate - show prevention tips
            title = "Prevent Air Quality Decline";
            badge = "Take Action";
            content = `
                <div class="improvement-grid">
                    <div class="improvement-section">
                        <h4><i class="fas fa-exclamation-triangle"></i> Prevention Tips</h4>
                        <div class="improvement-list">
                            <div class="improvement-item">
                                <i class="fas fa-car-side"></i>
                                <div class="improvement-text">
                                    <h5>Reduce Vehicle Use</h5>
                                    <p>Use public transport, carpool, or work from home</p>
                                </div>
                            </div>
                            <div class="improvement-item">
                                <i class="fas fa-mask"></i>
                                <div class="improvement-text">
                                    <h5>Sensitive Groups Beware</h5>
                                    <p>Children and elderly should limit outdoor exposure</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Unhealthy - show protective measures
            title = "Protect Your Health";
            badge = "Urgent Action";
            content = `
                <div class="improvement-grid">
                    <div class="improvement-section">
                        <h4><i class="fas fa-shield-alt"></i> Protective Measures</h4>
                        <div class="improvement-list">
                            <div class="improvement-item">
                                <i class="fas fa-home"></i>
                                <div class="improvement-text">
                                    <h5>Stay Indoors</h5>
                                    <p>Avoid outdoor activities and keep windows closed</p>
                                </div>
                            </div>
                            <div class="improvement-item">
                                <i class="fas fa-wind"></i>
                                <div class="improvement-text">
                                    <h5>Use Air Purifiers</h5>
                                    <p>Run HEPA air purifiers indoors continuously</p>
                                </div>
                            </div>
                            <div class="improvement-item">
                                <i class="fas fa-user-md"></i>
                                <div class="improvement-text">
                                    <h5>Seek Medical Advice</h5>
                                    <p>Consult healthcare provider if experiencing symptoms</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="quick-tips">
                    <h4><i class="fas fa-exclamation-circle"></i> Emergency Tips</h4>
                    <div class="tips-content">
                        <div class="tip-item">
                            <i class="fas fa-ban"></i>
                            <span>Avoid all outdoor exercise and activities</span>
                        </div>
                        <div class="tip-item">
                            <i class="fas fa-mask"></i>
                            <span>Wear N95 masks when going outside is necessary</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        improvementTitle.textContent = title;
        improvementBadge.textContent = badge;
        improvementContent.innerHTML = content;
        improvementSection.style.display = 'block';
    }

    // Decrypt button functionality with real data
    const decryptBtn = document.getElementById('view-logs-btn');
    
    decryptBtn.addEventListener('click', function() {
        const password = document.getElementById('password').value;
        const logOutput = document.getElementById('log-output');
        
        if (password) {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            this.disabled = true;
            
            setTimeout(() => {
                // Generate log content from stored history
                let logContent = `[${new Date().toISOString()}] Decryption successful
[INFO] AES-256 decryption completed
[DATA] Loading historical AQI data...

=== AQI LOG ENTRIES ===\n`;

                if (aqiHistory.length === 0) {
                    logContent += "No historical data available. Please refresh AQI to generate logs.\n";
                } else {
                    // Show last 10 entries
                    const recentEntries = aqiHistory.slice(-10);
                    recentEntries.forEach(entry => {
                        const date = new Date(entry.timestamp);
                        const formattedDate = date.toLocaleString();
                        logContent += `${formattedDate} | AQI: ${entry.aqi} | Status: ${entry.status}\n`;
                    });
                    
                    // Calculate average
                    const avgAqi = Math.round(recentEntries.reduce((sum, entry) => sum + entry.aqi, 0) / recentEntries.length);
                    
                    logContent += `\n[ANALYSIS] Average AQI: ${avgAqi}`;
                    logContent += `\n[TREND] Based on ${recentEntries.length} recent readings`;
                    logContent += `\n[LOCATION] ${recentEntries[recentEntries.length - 1].location}`;
                    logContent += `\n[NEXT_UPDATE] ${new Date(Date.now() + 15 * 60 * 1000).toISOString()}`;
                }

                logContent += `\n\n=== END OF LOG ===`;
                
                logOutput.value = logContent;
                
                this.innerHTML = '<i class="fas fa-unlock-alt"></i> Decrypt & View Logs';
                this.disabled = false;
            }, 1500);
        } else {
            alert('Please enter a password');
        }
    });

    // Update circular progress
    function updateCircularProgress(value) {
        const circle = document.getElementById('progress-circle');
        const circumference = 2 * Math.PI * 90;
        
        const normalizedValue = Math.min(value / 300, 1);
        const offset = circumference - (normalizedValue * circumference);
        
        circle.style.strokeDashoffset = offset;
        
        let color;
        if (value <= 50) color = '#10b981';
        else if (value <= 100) color = '#f59e0b';
        else if (value <= 150) color = '#f97316';
        else if (value <= 200) color = '#ef4444';
        else if (value <= 300) color = '#8b5cf6';
        else color = '#6b7280';
        
        circle.style.stroke = color;
    }

    // Update bar graph
    function updateBarGraph(currentAqi) {
        const bars = document.querySelectorAll('.bar-fill');
        const sampleData = [25, 15, 30, 10, 15, 5];
        
        bars.forEach(bar => {
            bar.style.height = '4px';
        });
        
        bars.forEach((bar, index) => {
            setTimeout(() => {
                const height = (sampleData[index] / 100) * 100;
                bar.style.height = height + 'px';
                
                const ranges = [50, 100, 150, 200, 300, 500];
                if (currentAqi <= ranges[index] && (index === 0 || currentAqi > ranges[index - 1])) {
                    bar.style.opacity = '1';
                    bar.style.boxShadow = '0 0 10px currentColor';
                } else {
                    bar.style.opacity = '0.7';
                    bar.style.boxShadow = 'none';
                }
            }, index * 100);
        });
    }

    // AQI refresh functionality
    window.refreshAqi = function() {
        const aqiValue = document.getElementById('aqi-value');
        const statusElement = document.getElementById('aqi-status');
        const refreshBtn = document.querySelector('.refresh-btn');
        
        refreshBtn.style.pointerEvents = 'none';
        aqiValue.textContent = 'Loading...';
        statusElement.textContent = 'Updating...';
        
        const circle = document.getElementById('progress-circle');
        circle.style.strokeDashoffset = '565.48';
        
        setTimeout(() => {
            const mockAqi = Math.floor(Math.random() * 300) + 1;
            aqiValue.textContent = mockAqi;
            
            let status;
            if (mockAqi <= 50) status = 'Good';
            else if (mockAqi <= 100) status = 'Moderate';
            else if (mockAqi <= 150) status = 'Unhealthy for Sensitive Groups';
            else if (mockAqi <= 200) status = 'Unhealthy';
            else if (mockAqi <= 300) status = 'Very Unhealthy';
            else status = 'Hazardous';
            
            statusElement.textContent = status;
            
            // Store the new AQI data
            storeAqiData(mockAqi, status);
            
            updateCircularProgress(mockAqi);
            updateBarGraph(mockAqi);
            
            // Generate and show improvement content based on AQI
            generateImprovementContent(mockAqi);
            
            document.querySelectorAll('.scale-item').forEach(item => {
                item.style.background = '';
                item.style.borderLeft = '';
            });
            
            let activeItem;
            if (mockAqi <= 50) activeItem = '.good';
            else if (mockAqi <= 100) activeItem = '.moderate';
            else if (mockAqi <= 150) activeItem = '.unhealthy-sensitive';
            else if (mockAqi <= 200) activeItem = '.unhealthy';
            else if (mockAqi <= 300) activeItem = '.very-unhealthy';
            else activeItem = '.hazardous';
            
            const active = document.querySelector(activeItem);
            if (active) {
                active.style.background = 'var(--bg-primary)';
                active.style.borderLeft = '4px solid var(--accent-blue)';
            }
            
            refreshBtn.style.pointerEvents = 'auto';
            
        }, 1000);
    };

    // Initialize
    refreshAqi();
    
    // Load improvement content if there's existing data
    if (currentAqiData) {
        generateImprovementContent(currentAqiData.aqi);
    }
});
