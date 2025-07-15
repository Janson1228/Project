document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;
    const currentTheme = localStorage.getItem('theme') || 'light';
    const settingsToggle = document.getElementById('settings-toggle');
    
    // Create settings dropdown
    const settingsDropdown = document.createElement('div');
    settingsDropdown.className = 'settings-dropdown';
    settingsDropdown.innerHTML = `
        <div class="setting-option">
            <label for="dark-mode">Dark Mode</label>
            <label class="switch">
                <input type="checkbox" id="dark-mode">
                <span class="slider round"></span>
            </label>
        </div>
        <div class="setting-option">
            <label for="notifications">Notifications</label>
            <label class="switch">
                <input type="checkbox" id="notifications" checked>
                <span class="slider round"></span>
            </label>
        </div>
        <div class="setting-option">
            <label for="voice-input">Voice Input</label>
            <label class="switch">
                <input type="checkbox" id="voice-input">
                <span class="slider round"></span>
            </label>
        </div>
    `;
    
    document.body.appendChild(settingsDropdown);
    
    // Set initial theme
    body.setAttribute('data-theme', currentTheme);
    const darkModeToggle = settingsDropdown.querySelector('#dark-mode');
    darkModeToggle.checked = currentTheme === 'dark';
    
    // Toggle dropdown
    settingsToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        settingsDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        settingsDropdown.classList.remove('active');
    });
    
    // Theme toggle functionality
    darkModeToggle.addEventListener('change', function() {
        const newTheme = this.checked ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // Settings toggles
    const notificationsToggle = settingsDropdown.querySelector('#notifications');
    const voiceInputToggle = settingsDropdown.querySelector('#voice-input');
    
    // Load saved settings
    notificationsToggle.checked = localStorage.getItem('notifications') !== 'false';
    voiceInputToggle.checked = localStorage.getItem('voiceInput') === 'true';
    
    notificationsToggle.addEventListener('change', function() {
        localStorage.setItem('notifications', this.checked);
    });
    
    voiceInputToggle.addEventListener('change', function() {
        localStorage.setItem('voiceInput', this.checked);
    });
    
    // Navigation functionality
    const navLinks = document.querySelectorAll('.sidebar a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            navigateTo(targetId);
            
            // Update active state
            navLinks.forEach(navLink => navLink.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');
            
            // Close sidebar on mobile
            if (window.innerWidth <= 992) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    });
    
    function navigateTo(sectionId) {
        const sections = document.querySelectorAll('.content-section');
        
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });
    }
    
    // Emotion selection
    const emotionIcons = document.querySelectorAll('.emotion-icons i');
    
    emotionIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            emotionIcons.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Voice recording functionality
    const voiceBtn = document.getElementById('voice-btn');
    let recognition;
    
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = function() {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Listening...';
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('dream-text').value = transcript;
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        };
        
        recognition.onend = function() {
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        };
        
        voiceBtn.addEventListener('click', function() {
            try {
                recognition.start();
            } catch (error) {
                alert('Voice recognition failed. Please ensure you have microphone access.');
                console.error(error);
            }
        });
    } else {
        voiceBtn.style.display = 'none';
    }
    
    // Save dream functionality
    const saveBtn = document.querySelector('.save-btn');
    
    saveBtn.addEventListener('click', function() {
        const dreamText = document.getElementById('dream-text').value;
        const selectedEmotion = document.querySelector('.emotion-icons i.active');
        
        if (!dreamText) {
            alert('Please describe your dream first.');
            return;
        }
        
        if (!selectedEmotion) {
            alert('Please select how you felt during the dream.');
            return;
        }
        
        console.log('Dream saved:', {
            text: dreamText,
            emotion: selectedEmotion.dataset.emotion,
            date: new Date().toISOString()
        });
        
        alert('Dream saved successfully!');
        document.getElementById('dream-text').value = '';
        emotionIcons.forEach(i => i.classList.remove('active'));
        
        // Navigate to home
        navigateTo('home');
        navLinks.forEach(navLink => {
            navLink.parentElement.classList.remove('active');
            if (navLink.getAttribute('href') === '#home') {
                navLink.parentElement.classList.add('active');
            }
        });
    });
    
    // Simple graphs for analytics (mock data)
    function drawSimpleGraph(containerId, dataPoints, color) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 100 30');
        
        const pathData = dataPoints.map((point, i) => {
            const x = (i / (dataPoints.length - 1)) * 100;
            const y = 30 - (point * 30);
            return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
        }).join(' ');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color || '#6a5acd');
        path.setAttribute('stroke-width', '0.5');
        
        svg.appendChild(path);
        container.appendChild(svg);
    }
    
    // Generate mock data for graphs
    function generateMockData(points = 20, variance = 0.3) {
        const data = [];
        let current = 0.5;
        
        for (let i = 0; i < points; i++) {
            current = Math.max(0.1, Math.min(0.9, current + (Math.random() * variance * 2 - variance)));
            data.push(current);
        }
        
        return data;
    }
    
    // Draw graphs when analytics section is shown
    document.getElementById('analytics').addEventListener('click', function() {
        drawSimpleGraph('heart-rate-graph', generateMockData(30, 0.7), '#e74c3c');
        drawSimpleGraph('breathing-graph', generateMockData(25, 1.0), '#3498db');
        drawSimpleGraph('movement-graph', generateMockData(20, 0.4), '#2ecc71');
    });
    
    // Initialize with home section active
    navigateTo('home');
});