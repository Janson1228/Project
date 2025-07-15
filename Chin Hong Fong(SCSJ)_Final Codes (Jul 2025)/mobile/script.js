document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const themeBtn = document.getElementById('theme-btn');
    const newDreamBtn = document.getElementById('new-dream-btn');
    const viewStatsBtn = document.getElementById('view-stats-btn');
    const saveDreamBtn = document.getElementById('save-dream-btn');
    const dreamText = document.getElementById('dream-text');
    const moodBtns = document.querySelectorAll('.mood-btn');
    const navLinks = document.querySelectorAll('#sidebar a');
    const screens = document.querySelectorAll('.screen');
    const dreamsList = document.getElementById('dreams-list');
    const totalDreamsEl = document.getElementById('total-dreams');
    const commonMoodEl = document.getElementById('common-mood');
    const lastRecordedEl = document.getElementById('last-recorded');
    const currentTimeEl = document.getElementById('current-time');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const voiceInputToggle = document.getElementById('voice-input-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const moodChartCtx = document.getElementById('mood-chart').getContext('2d');
    const voiceInputBtn = document.getElementById('voice-input-btn');
    const userSelect = document.getElementById('user-select');
    const heartRateEl = document.getElementById('heart-rate');
    const breathingRateEl = document.getElementById('breathing-rate');
    const movementEl = document.getElementById('movement');
    const avgHeartRateEl = document.getElementById('avg-heart-rate');
    const avgBreathingEl = document.getElementById('avg-breathing');
    const sleepQualityEl = document.getElementById('sleep-quality');

    // App State
    let dreams = JSON.parse(localStorage.getItem('dreams')) || [];
    let selectedMood = null;
    let moodChart = null;
    let isRecording = false;
    let recognition = null;

    const userMetrics = {
        alex: {
            heartRate: 62,
            breathingRate: 14,
            movement: 12
        },
        jamie: {
            heartRate: 58,
            breathingRate: 12,
            movement: 8
        },
        sam: {
            heartRate: 65,
            breathingRate: 16,
            movement: 15
        }
    };

    // Initialize
    updateTime();
    setInterval(updateTime, 60000);
    renderDreamsList();
    updateStats();
    initChart();
    loadSettings();
    updateUserMetrics();

    // Event Listeners
    menuBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    themeBtn.addEventListener('click', toggleTheme);
    newDreamBtn.addEventListener('click', () => showScreen('journal'));
    viewStatsBtn.addEventListener('click', () => showScreen('analytics'));
    saveDreamBtn.addEventListener('click', saveDream);
    voiceInputBtn.addEventListener('click', toggleVoiceRecording);
    userSelect.addEventListener('change', updateUserMetrics);
    
    moodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            moodBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedMood = this.getAttribute('data-mood');
        });
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const screenId = this.getAttribute('data-section');
            showScreen(screenId);
            setActiveNav(this);
            closeSidebar();
        });
    });

    darkModeToggle.addEventListener('change', toggleDarkMode);
    voiceInputToggle.addEventListener('change', toggleVoiceInput);
    notificationsToggle.addEventListener('change', toggleNotifications);

    // Functions
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        sidebarOverlay.classList.toggle('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    }

    function showScreen(screenId) {
        screens.forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        
        if (screenId === 'analytics') {
            updateChart();
        }
    }

    function setActiveNav(activeLink) {
        navLinks.forEach(link => link.parentElement.classList.remove('active'));
        activeLink.parentElement.classList.add('active');
    }

    function saveDream() {
        const text = dreamText.value.trim();
        
        if (text.length < 10) {
            alert('Please describe your dream in more detail (at least 10 characters)');
            return;
        }
        
        if (!selectedMood) {
            alert('Please select your mood');
            return;
        }
        
        const newDream = {
            id: Date.now(),
            text: text,
            mood: selectedMood,
            date: new Date().toISOString(),
            heartRate: userMetrics[userSelect.value].heartRate + Math.floor(Math.random() * 5) - 2,
            breathingRate: userMetrics[userSelect.value].breathingRate + Math.floor(Math.random() * 3) - 1,
            movement: userMetrics[userSelect.value].movement + Math.floor(Math.random() * 5) - 2
        };
        
        dreams.unshift(newDream);
        
        try {
            localStorage.setItem('dreams', JSON.stringify(dreams));
        } catch (e) {
            console.error("Failed to save dreams:", e);
            alert("Failed to save your dream. Please try again.");
            return;
        }
        
        // Reset form
        dreamText.value = '';
        moodBtns.forEach(btn => btn.classList.remove('active'));
        selectedMood = null;
        
        // Update UI
        renderDreamsList();
        updateStats();
        updateChart();
        showScreen('home');
        setActiveNav(document.querySelector('[data-section="home"]'));
    }

    function renderDreamsList() {
        dreamsList.innerHTML = dreams.slice(0, 3).map(dream => `
            <div class="dream-item">
                <p>${dream.text.length > 60 ? dream.text.substring(0, 60) + '...' : dream.text}</p>
                <div class="dream-date">
                    <i class="far fa-calendar-alt"></i>
                    ${new Date(dream.date).toLocaleDateString()}
                    <span class="mood-indicator" style="color: ${getMoodColor(dream.mood)};">
                        <i class="${getMoodIcon(dream.mood)}"></i>
                    </span>
                </div>
            </div>
        `).join('') || '<p>No dreams recorded yet</p>';
    }

    function updateStats() {
        totalDreamsEl.textContent = dreams.length;
        
        if (dreams.length > 0) {
            // Find most common mood
            const moodCounts = {};
            dreams.forEach(dream => {
                moodCounts[dream.mood] = (moodCounts[dream.mood] || 0) + 1;
            });
            
            const mostCommon = Object.entries(moodCounts).reduce((a, b) => 
                a[1] > b[1] ? a : b, ['', 0]);
            
            commonMoodEl.textContent = mostCommon[0].charAt(0).toUpperCase() + mostCommon[0].slice(1);
            lastRecordedEl.textContent = new Date(dreams[0].date).toLocaleDateString();
            
            // Sleep metrics
            const totalHeartRate = dreams.reduce((sum, dream) => sum + (dream.heartRate || 0), 0);
            const totalBreathing = dreams.reduce((sum, dream) => sum + (dream.breathingRate || 0), 0);
            
            avgHeartRateEl.textContent = Math.round(totalHeartRate / dreams.length);
            avgBreathingEl.textContent = Math.round(totalBreathing / dreams.length);
            
            // Simple sleep quality calculation
            const avgMovement = dreams.reduce((sum, dream) => sum + (dream.movement || 0), 0) / dreams.length;
            const quality = 100 - (avgMovement * 2);
            sleepQualityEl.textContent = `${Math.min(100, Math.max(0, Math.round(quality)))}%`;
        } else {
            commonMoodEl.textContent = '-';
            lastRecordedEl.textContent = '-';
            avgHeartRateEl.textContent = '--';
            avgBreathingEl.textContent = '--';
            sleepQualityEl.textContent = '--';
        }
    }

    function initChart() {
        moodChart = new Chart(moodChartCtx, {
            type: 'bar',
            data: {
                labels: ['Happy', 'Sad', 'Angry', 'Anxious'],
                datasets: [{
                    label: 'Dream Moods',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 206, 86, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: function(context) {
                                return getComputedStyle(document.body).getPropertyValue('--text-color');
                            }
                        },
                        grid: {
                            color: function(context) {
                                return getComputedStyle(document.body).getPropertyValue('--shadow-color');
                            }
                        }
                    },
                    x: {
                        ticks: {
                            color: function(context) {
                                return getComputedStyle(document.body).getPropertyValue('--text-color');
                            }
                        },
                        grid: {
                            color: function(context) {
                                return getComputedStyle(document.body).getPropertyValue('--shadow-color');
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: function(context) {
                                return getComputedStyle(document.body).getPropertyValue('--text-color');
                            }
                        }
                    }
                }
            }
        });
        updateChart();
    }

    function updateChart() {
        if (!moodChart) return;
        
        const moodCounts = {
            happy: 0,
            sad: 0,
            angry: 0,
            anxious: 0
        };
        
        dreams.forEach(dream => {
            moodCounts[dream.mood]++;
        });
        
        moodChart.data.datasets[0].data = [
            moodCounts.happy,
            moodCounts.sad,
            moodCounts.angry,
            moodCounts.anxious
        ];
        
        moodChart.update();
    }

    function toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        darkModeToggle.checked = !isDark;
        
        if (moodChart) {
            setTimeout(() => {
                moodChart.update();
            }, 100);
        }
    }

    function toggleDarkMode() {
        document.body.setAttribute('data-theme', this.checked ? 'dark' : 'light');
        localStorage.setItem('theme', this.checked ? 'dark' : 'light');
        
        if (moodChart) {
            setTimeout(() => {
                moodChart.update();
            }, 100);
        }
    }

    function toggleVoiceInput() {
        localStorage.setItem('voiceInput', this.checked ? 'on' : 'off');
    }

    function toggleNotifications() {
        localStorage.setItem('notifications', this.checked ? 'on' : 'off');
    }

    function loadSettings() {
        // Load theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        darkModeToggle.checked = savedTheme === 'dark';
        
        // Load other settings
        voiceInputToggle.checked = localStorage.getItem('voiceInput') === 'on';
        notificationsToggle.checked = localStorage.getItem('notifications') !== 'off';
        
        if (savedTheme === 'dark' && moodChart) {
            setTimeout(() => {
                moodChart.update();
            }, 100);
        }
    }

    function updateTime() {
        const now = new Date();
        currentTimeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function getMoodIcon(mood) {
        const icons = {
            happy: 'fa-smile',
            sad: 'fa-sad-tear',
            angry: 'fa-angry',
            anxious: 'fa-flushed'
        };
        return icons[mood] || 'fa-question';
    }

    function getMoodColor(mood) {
        const colors = {
            happy: '#f1c40f',
            sad: '#3498db',
            angry: '#e74c3c',
            anxious: '#9b59b6'
        };
        return colors[mood] || '#95a5a6';
    }

    function updateUserMetrics() {
        const user = userSelect.value;
        const metrics = userMetrics[user];
        
        heartRateEl.textContent = metrics.heartRate;
        breathingRateEl.textContent = metrics.breathingRate;
        movementEl.textContent = metrics.movement;
    }

    function toggleVoiceRecording() {
        if (isRecording) {
            stopVoiceRecording();
        } else {
            startVoiceRecording();
        }
    }

    function initVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice recognition not supported in your browser");
            voiceInputToggle.disabled = true;
            return;
        }

        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = function(event) {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            
            if (!dreamText.value.includes(transcript)) {
                dreamText.value += ' ' + transcript;
            }
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            stopVoiceRecording();
        };
    }

    function startVoiceRecording() {
        if (!recognition && voiceInputToggle.checked) {
            initVoiceRecognition();
        }
        
        if (recognition && voiceInputToggle.checked) {
            recognition.start();
            isRecording = true;
            voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Stop Recording';
            voiceInputBtn.classList.add('recording');
        }
    }

    function stopVoiceRecording() {
        if (recognition) {
            recognition.stop();
            isRecording = false;
            voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
            voiceInputBtn.classList.remove('recording');
        }
    }
});