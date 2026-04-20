// Global App Configuration with Backend Integration
const API_BASE_URL = 'http://localhost:3000/api';

const App = {
    // User data
    user: {
        id: localStorage.getItem('userId'),
        name: localStorage.getItem('userName') || 'Guest',
        email: localStorage.getItem('userEmail') || '',
        avatar: localStorage.getItem('userAvatar') || 'GU',
        token: localStorage.getItem('authToken') || null
    },

    // Notifications
    notifications: JSON.parse(localStorage.getItem('notifications') || '[]'),
    
    // Messages
    conversations: JSON.parse(localStorage.getItem('conversations') || '[]'),
    socket: null,

    // Initialize app
    init() {
        this.setupHeader();
        this.setupNavigation();
        this.setupNotifications();
        this.setupMessaging();
        this.setupActiveNavigation();
        
        // If user is logged in, fetch fresh data from backend
        if (this.user.token) {
            this.syncUserData();
            this.initSocket();
        }
        
        console.log('✓ App initialized');
    },

    // Setup header with notifications and messaging
    setupHeader() {
        const header = document.querySelector('header');
        if (!header) return;

        // Find or create user menu
        let userMenu = header.querySelector('.user-menu');
        if (!userMenu) {
            userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            userMenu.innerHTML = `
                <span class="user-info" id="userDisplay">${this.user.name}</span>
                <div class="header-icons">
                    <button class="icon-btn" id="notifications-btn" title="Notifications">
                        <i class="fas fa-bell"></i>
                        <span class="notification-badge" style="display: none;">0</span>
                    </button>
                    <button class="icon-btn" id="messaging-btn" title="Messages">
                        <i class="fas fa-envelope"></i>
                        <span class="messaging-badge" style="display: none;">0</span>
                    </button>
                    <button class="btn-logout" onclick="App.logout()">Logout</button>
                </div>
            `;
            const nav = header.querySelector('nav');
            if (nav) nav.appendChild(userMenu);
        }

        // Add notification and messaging panels
        if (!document.querySelector('.notifications-panel')) {
            document.body.insertAdjacentHTML('beforeend', this.getNotificationsPanelHTML());
        }
        if (!document.querySelector('.messaging-panel')) {
            document.body.insertAdjacentHTML('beforeend', this.getMessagingPanelHTML());
        }
    },

    // Setup navigation
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-links a, header nav a');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('active');
            }
        });
    },

    // Setup active navigation highlighting
    setupActiveNavigation() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('header nav a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes(currentPage)) {
                link.classList.add('active');
            }
        });
    },

    // Setup notifications
    setupNotifications() {
        const notificationsBtn = document.getElementById('notifications-btn');
        if (!notificationsBtn) return;

        notificationsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotificationsPanel();
        });

        this.updateNotificationBadge();

        document.addEventListener('click', (e) => {
            const panel = document.querySelector('.notifications-panel');
            if (panel && !panel.contains(e.target) && !notificationsBtn.contains(e.target)) {
                panel.classList.remove('active');
            }
        });
    },

    // Setup messaging
    setupMessaging() {
        const messagingBtn = document.getElementById('messaging-btn');
        if (!messagingBtn) return;

        messagingBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMessagingPanel();
        });

        this.updateMessagingBadge();

        document.addEventListener('click', (e) => {
            const panel = document.querySelector('.messaging-panel');
            if (panel && !panel.contains(e.target) && !messagingBtn.contains(e.target)) {
                panel.classList.remove('active');
            }
        });
    },

    // Initialize socket connection for realtime messaging and calls
    initSocket() {
        if (!this.user.token) return;

        // Load Socket.IO client if not present
        if (typeof io === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
            script.onload = () => this._connectSocket();
            document.head.appendChild(script);
        } else {
            this._connectSocket();
        }
    },

    _connectSocket() {
        try {
            const base = API_BASE_URL.replace('/api', '');
            this.socket = io(base, { transports: ['websocket'], auth: { token: this.user.token } });

            this.socket.on('connect', () => {
                console.log('Socket connected', this.socket.id);
            });

            this.socket.on('message', (m) => {
                this.addNotification('New message received', 'info');
                this.fetchConversations();
            });

            this.socket.on('group_message', (m) => {
                this.addNotification('New group message', 'info');
            });

            this.socket.on('signal', (payload) => {
                 // Handle WebRTC signaling payloads
                console.log('Signal received', payload);
            });

            this.socket.on('call_started', (payload) => {
                this.showIncomingCallModal(payload);
            });

            this.socket.on('call_ended', (payload) => {
                this.addNotification('Call ended', 'info');
            });
        } catch (e) {
            console.error('Socket init failed', e);
        }
    },

    // WebRTC helpers
    peerConnections: {},
    localStreams: {},

    async captureLocalStream(isVideo = false) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: !!isVideo });
            return stream;
        } catch (e) {
            console.error('Media capture failed', e);
            this.addNotification('Unable to access microphone/camera', 'error');
            throw e;
        }
    },

    _ensurePeerConnection(peerId, callId, isInitiator, isVideo) {
        const key = `${callId}:${peerId}`;
        if (this.peerConnections[key]) return this.peerConnections[key];

        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                this.socket.emit('signal', { room: `conv_${callId}`, data: { type: 'candidate', candidate: e.candidate, callId } });
            }
        };

        pc.ontrack = (e) => {
            // Attach remote stream to UI
            this._attachRemoteStream(callId, peerId, e.streams[0]);
        };

        this.peerConnections[key] = pc;
        return pc;
    },

    _attachRemoteStream(callId, peerId, stream) {
        let container = document.getElementById('call-container');
        if (!container) {
            this._createCallUI(callId);
            container = document.getElementById('call-container');
        }

        let remote = document.getElementById(`remote_${callId}_${peerId}`);
        if (!remote) {
            remote = document.createElement('video');
            remote.id = `remote_${callId}_${peerId}`;
            remote.autoplay = true;
            remote.playsInline = true;
            remote.style.width = '240px';
            remote.style.height = '180px';
            container.querySelector('.remotes').appendChild(remote);
        }
        try {
            remote.srcObject = stream;
        } catch (e) {
            remote.src = URL.createObjectURL(stream);
        }
    },

    _createCallUI(callId) {
        // Simple overlay for call
        const overlay = document.createElement('div');
        overlay.id = 'call-container';
        overlay.style.position = 'fixed';
        overlay.style.right = '20px';
        overlay.style.bottom = '20px';
        overlay.style.zIndex = 4000;
        overlay.style.background = 'rgba(0,0,0,0.6)';
        overlay.style.padding = '8px';
        overlay.style.borderRadius = '8px';
        overlay.innerHTML = `
            <div style="display:flex;gap:8px;align-items:center;">
                <div class="locals"></div>
                <div class="remotes"></div>
            </div>
            <div style="margin-top:8px;text-align:right;">
                <button id="endcall_btn">End Call</button>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('endcall_btn').onclick = () => this.endCall(callId);
    },

    // Incoming call modal
    showIncomingCallModal(payload) {
        this.removeIncomingCallModal();
        const modal = document.createElement('div');
        modal.id = 'incoming-call-modal';
        modal.style.position = 'fixed';
        modal.style.left = '50%';
        modal.style.top = '20%';
        modal.style.transform = 'translateX(-50%)';
        modal.style.background = '#fff';
        modal.style.padding = '16px';
        modal.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
        modal.style.zIndex = 5000;
        modal.innerHTML = `
            <div style="margin-bottom:8px;"><strong>Incoming call</strong></div>
            <div style="margin-bottom:12px;">From: ${payload.by || payload.from || 'Unknown'}</div>
            <div style="text-align:right;">
                <button id="decline_call_btn">Decline</button>
                <button id="accept_call_btn">Accept</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('accept_call_btn').onclick = async () => {
            const room = payload.room || payload.roomId || payload.callId || payload.groupId;
            const callId = payload.callId || ('call_' + Date.now());
            this.socket.emit('join_room', { room, userId: this.user.id });
            this.removeIncomingCallModal();
            this.addNotification('Call accepted — setting up media', 'success');
            // capture media early to be ready for offer/answer
            try {
                const isVideo = !!payload.isVideo;
                const stream = await this.captureLocalStream(isVideo);
                this.localStreams[callId] = stream;
                this._createCallUI(callId);
                // attach local stream to UI
                const localEl = document.createElement('video');
                localEl.autoplay = true; localEl.muted = true; localEl.playsInline = true; localEl.style.width='120px';
                try { localEl.srcObject = stream; } catch (e) { localEl.src = URL.createObjectURL(stream); }
                document.getElementById('call-container').querySelector('.locals').appendChild(localEl);
            } catch (e) { }
        };
        document.getElementById('decline_call_btn').onclick = () => {
            this.removeIncomingCallModal();
            this.addNotification('Call declined', 'info');
        };
    },

    removeIncomingCallModal() {
        const existing = document.getElementById('incoming-call-modal');
        if (existing) existing.remove();
    },

    // Modal for selecting call target
    showTargetModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.id = 'target-modal';
            modal.style.position = 'fixed';
            modal.style.left = '50%';
            modal.style.top = '30%';
            modal.style.transform = 'translateX(-50%)';
            modal.style.background = '#fff';
            modal.style.padding = '20px';
            modal.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
            modal.style.zIndex = 5000;
            modal.style.borderRadius = '8px';
            modal.style.minWidth = '320px';
            modal.innerHTML = `
                <div style="margin-bottom:12px;"><strong>Start a call</strong></div>
                <div style="margin-bottom:8px;font-size:12px;color:#666;">Enter user id, group id, or conversation id</div>
                <input id="target_input" type="text" placeholder="u:user123 or g:group456 or conv_789" style="width:100%;padding:8px;margin-bottom:12px;box-sizing:border-box;border:1px solid #ddd;border-radius:4px;">
                <div style="text-align:right;">
                    <button onclick="document.getElementById('target-modal').remove(); targetResolve(null);" style="margin-right:8px;">Cancel</button>
                    <button onclick="targetResolve(document.getElementById('target_input').value);" style="background:#007bff;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">Next</button>
                </div>
            `;
            window.targetResolve = (val) => {
                const existing = document.getElementById('target-modal');
                if (existing) existing.remove();
                delete window.targetResolve;
                resolve(val);
            };
            document.body.appendChild(modal);
            document.getElementById('target_input').focus();
        });
    },

    // Modal for selecting call type (audio or video)
    showCallTypeModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.id = 'calltype-modal';
            modal.style.position = 'fixed';
            modal.style.left = '50%';
            modal.style.top = '40%';
            modal.style.transform = 'translateX(-50%)';
            modal.style.background = '#fff';
            modal.style.padding = '20px';
            modal.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
            modal.style.zIndex = 5000;
            modal.style.borderRadius = '8px';
            modal.innerHTML = `
                <div style="margin-bottom:12px;"><strong>Select call type</strong></div>
                <div style="text-align:right;gap:8px;display:flex;justify-content:flex-end;">
                    <button onclick="document.getElementById('calltype-modal').remove(); callTypeResolve(null);" style="margin-right:8px;">Cancel</button>
                    <button onclick="document.getElementById('calltype-modal').remove(); callTypeResolve(false);" style="background:#6c757d;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">🎤 Voice</button>
                    <button onclick="document.getElementById('calltype-modal').remove(); callTypeResolve(true);" style="background:#28a745;color:#fff;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;">📹 Video</button>
                </div>
            `;
            window.callTypeResolve = (val) => {
                delete window.callTypeResolve;
                resolve(val);
            };
            document.body.appendChild(modal);
        });
    },

    async handleSignal(payload) {
        try {
            const data = payload.data || payload;
            const callId = data.callId;
            const from = payload.from || data.from || 'remote';
            if (!callId) return;

            if (data.type === 'offer') {
                // Remote initiated an offer — we're callee
                const isVideo = !!data.isVideo;
                const localStream = await this.captureLocalStream(isVideo);
                this.localStreams[callId] = localStream;
                this._createCallUI(callId);
                const key = `${callId}:${from}`;
                const pc = this._ensurePeerConnection(from, callId, false, isVideo);
                // add tracks
                localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                this.socket.emit('signal', { room: `conv_${callId}`, data: { type: 'answer', sdp: answer.sdp, callId } });
            } else if (data.type === 'answer') {
                // Remote answered our offer — try to find matching peer connection
                const key = `${callId}:${from}`;
                let pc = this.peerConnections[key];
                if (!pc) {
                    // fallback: find any pc for this callId whose localDescription type is 'offer'
                    for (const k of Object.keys(this.peerConnections)) {
                        if (k.startsWith(callId + ':')) {
                            const cand = this.peerConnections[k];
                            try {
                                const localDesc = cand.localDescription;
                                if (localDesc && localDesc.type === 'offer') {
                                    pc = cand;
                                    break;
                                }
                            } catch (e) {}
                        }
                    }
                }
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
                }
            } else if (data.type === 'candidate') {
                // ICE candidate
                const pcs = Object.values(this.peerConnections);
                for (const pc of pcs) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (e) { /* ignore */ }
                }
            }
        } catch (e) {
            console.error('Error handling signal', e);
        }
    },

    async endCall(callId) {
        // Close local streams and peer connections
        for (const k of Object.keys(this.peerConnections)) {
            if (k.startsWith(callId + ':')) {
                try { this.peerConnections[k].close(); } catch (e) {}
                delete this.peerConnections[k];
            }
        }
        if (this.localStreams[callId]) {
            this.localStreams[callId].getTracks().forEach(t => t.stop());
            delete this.localStreams[callId];
        }
        const container = document.getElementById('call-container');
        if (container) container.remove();
        if (this.socket) this.socket.emit('end_call', { room: `conv_${callId}`, callId });
        this.addNotification('Call ended', 'info');
    },

    // Sync user data from backend
    async syncUserData() {
        try {
            // Get user profile
            const profileRes = await fetch(`${API_BASE_URL}/users/profile`, {
                headers: { 'Authorization': `Bearer ${this.user.token}` }
            });

            if (profileRes.ok) {
                const data = await profileRes.json();
                this.user = {
                    ...this.user,
                    ...data.user
                };
                localStorage.setItem('userName', data.user.username);
                document.getElementById('userDisplay').textContent = data.user.username;
            }

            // Get notifications
            await this.fetchNotifications();
            await this.fetchConversations();
        } catch (err) {
            console.error('Error syncing user data:', err);
        }
    },

    // Fetch notifications from backend
    async fetchNotifications() {
        if (!this.user.token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${this.user.token}` }
            });

            if (res.ok) {
                const data = await res.json();
                this.notifications = data.notifications || [];
                localStorage.setItem('notifications', JSON.stringify(this.notifications));
                this.updateNotificationList();
                this.updateNotificationBadge();
            }
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    },

    // Fetch conversations from backend
    async fetchConversations() {
        if (!this.user.token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/messages/conversations`, {
                headers: { 'Authorization': `Bearer ${this.user.token}` }
            });

            if (res.ok) {
                const data = await res.json();
                this.conversations = data.conversations || [];
                localStorage.setItem('conversations', JSON.stringify(this.conversations));
                this.updateConversationsList();
                this.updateMessagingBadge();
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    },

    // Toggle notifications panel
    toggleNotificationsPanel() {
        const panel = document.querySelector('.notifications-panel');
        const messagingPanel = document.querySelector('.messaging-panel');
        if (messagingPanel) messagingPanel.classList.remove('active');
        panel.classList.toggle('active');
        this.fetchNotifications();
    },

    // Toggle messaging panel
    toggleMessagingPanel() {
        const panel = document.querySelector('.messaging-panel');
        const notificationsPanel = document.querySelector('.notifications-panel');
        if (notificationsPanel) notificationsPanel.classList.remove('active');
        panel.classList.toggle('active');
        this.fetchConversations();
    },

    // Add notification
    addNotification(message, type = 'info', linkTo = null) {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: true,
            linkTo
        };

        this.notifications.unshift(notification);
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.updateNotificationList();
        this.updateNotificationBadge();
        this.showToast(message, type);
    },

    // Update notification badge
    updateNotificationBadge() {
        const badge = document.querySelector('.notification-badge');
        const unreadCount = this.notifications.filter(n => n.unread).length;
        if (badge) {
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    },

    // Update notification list
    updateNotificationList() {
        const list = document.querySelector('.notifications-list');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="notifications-empty">No notifications</div>';
            return;
        }

        list.innerHTML = this.notifications.map(notif => `
            <div class="notification-item ${notif.unread ? 'unread' : ''}" onclick="App.handleNotificationClick(${notif.id})">
                <div class="notification-text">${notif.message}</div>
                <div class="notification-time">${notif.timestamp}</div>
            </div>
        `).join('');
    },

    // Handle notification click
    handleNotificationClick(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.unread = false;
            localStorage.setItem('notifications', JSON.stringify(this.notifications));
            this.updateNotificationBadge();
            this.updateNotificationList();
            if (notification.linkTo) {
                window.location.href = notification.linkTo;
            }
        }
    },

    // Clear notifications
    clearNotifications() {
        this.notifications = [];
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
        this.updateNotificationList();
        this.updateNotificationBadge();
    },

    // Update messaging badge
    updateMessagingBadge() {
        const badge = document.querySelector('.messaging-badge');
        const unreadMessages = this.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        if (badge) {
            badge.textContent = unreadMessages;
            badge.style.display = unreadMessages > 0 ? 'flex' : 'none';
        }
    },

    // Update conversations list
    updateConversationsList() {
        const list = document.querySelector('.conversations-list');
        if (!list) return;

        if (this.conversations.length === 0) {
            list.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">No conversations</div>';
            return;
        }

        list.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item" onclick="App.openConversation('${conv.id}')">
                <div class="conversation-avatar">${(conv.other_user_name || 'U').charAt(0).toUpperCase()}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${conv.other_user_name || 'Unknown'}</div>
                    <div class="conversation-preview">${conv.last_message || 'No messages yet'}</div>
                </div>
            </div>
        `).join('');
    },

    // Add conversation
    addConversation(name, lastMessage = 'Started a new conversation') {
        const conversation = {
            id: 'conv_' + Date.now(),
            name,
            lastMessage,
            unread: true,
            timestamp: new Date()
        };

        this.conversations.unshift(conversation);
        localStorage.setItem('conversations', JSON.stringify(this.conversations));
        this.updateConversationsList();
        this.updateMessagingBadge();
    },

    // Open conversation
    openConversation(id) {
        const conv = this.conversations.find(c => c.id === id);
        if (conv) {
            conv.unread = false;
            localStorage.setItem('conversations', JSON.stringify(this.conversations));
            this.updateConversationsList();
            this.updateMessagingBadge();
            // Join socket room for realtime updates
            if (this.socket) this.socket.emit('join_room', { room: `conv_${id}`, userId: this.user.id });
            alert(`Opening conversation with ${conv.other_user_name}`);
        }
    },

    // Send message
    async sendMessage(message) {
        if (!message.trim()) return;

        const inputField = document.querySelector('.messaging-input input');
        if (inputField) {
            inputField.value = '';
        }

        this.addNotification(`Message sent: "${message}"`, 'success');
    },

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 16px 24px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 3000;
            animation: slideIn 0.3s ease;
            font-weight: 600;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Get notifications panel HTML
    getNotificationsPanelHTML() {
        return `
            <div class="notifications-panel">
                <div class="notifications-header">
                    <h3>Notifications</h3>
                    <button class="clear-notifications" onclick="App.clearNotifications()">Clear</button>
                </div>
                <div class="notifications-list">
                    <div class="notifications-empty">No notifications</div>
                </div>
            </div>
        `;
    },

    // Get messaging panel HTML
    getMessagingPanelHTML() {
        return `
            <div class="messaging-panel">
                <div class="messaging-header">
                    <h3>Messages</h3>
                    <button class="new-message-btn" onclick="App.startNewMessage()">+ New</button>
                    <button class="new-group-btn" onclick="App.createGroup()">+ Group</button>
                    <button class="start-call-btn" onclick="App.startCall()">Start Call</button>
                </div>
                <div class="conversations-list">
                    <div style="padding: 20px; text-align: center; color: #888;">No conversations</div>
                </div>
                <div class="messaging-input">
                    <input type="text" placeholder="Type message..." onkeypress="if(event.key==='Enter') App.sendMessage(this.value)">
                    <button onclick="App.sendMessage(document.querySelector('.messaging-input input').value)">Send</button>
                </div>
            </div>
        `;
    },

    // Start new message
    startNewMessage() {
        const name = prompt('Enter contact name:');
        if (name) {
            this.addConversation(name);
            this.updateConversationsList();
        }
    },

    // Start call with a user, conversation or group
    async startCall() {
        const target = await this.showTargetModal();
        if (!target) return;

        let room = null;
        if (target.startsWith('u:')) {
            const userId = target.slice(2).trim();
            if (!userId) return this.addNotification('Invalid user id', 'error');
            // Ensure conversation exists
            try {
                const res = await fetch(`${API_BASE_URL}/messages/conversation/${encodeURIComponent(userId)}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.user.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    room = `conv_${data.conversationId}`;
                } else {
                    return this.addNotification('Failed to create/get conversation', 'error');
                }
            } catch (e) {
                console.error('Conversation create error', e);
                return this.addNotification('Failed to create/get conversation', 'error');
            }
        } else if (target.startsWith('g:')) {
            const groupId = target.slice(2).trim();
            if (!groupId) return this.addNotification('Invalid group id', 'error');
            room = `group_${groupId}`;
        } else {
            room = target.startsWith('conv_') || target.startsWith('group_') ? target : `conv_${target}`;
        }

        const isVideo = await this.showCallTypeModal();
        if (isVideo === null) return;
        const callId = 'call_' + Date.now();
        if (this.socket) {
            // Capture media and prep local stream
            try {
                const stream = await this.captureLocalStream(isVideo);
                this.localStreams[callId] = stream;
                this._createCallUI(callId);
                const localEl = document.createElement('video');
                localEl.autoplay = true; localEl.muted = true; localEl.playsInline = true; localEl.style.width='120px';
                try { localEl.srcObject = stream; } catch (e) { localEl.src = URL.createObjectURL(stream); }
                document.getElementById('call-container').querySelector('.locals').appendChild(localEl);
            } catch (e) {
                return this.addNotification('Failed to capture media', 'error');
            }
            // Join room and emit start_call
            this.socket.emit('join_room', { room, userId: this.user.id });
            this.socket.emit('start_call', { room, callId, isVideo });
            this.addNotification('Call started', 'success');
        } else {
            this.addNotification('Realtime connection not established', 'error');
        }
    },

    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            this.user = {};
            window.location.href = 'signinorup.html';
        }
    }
};

// CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
