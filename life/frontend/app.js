// Global App Configuration
const App = {
    // User data
    user: {
        id: localStorage.getItem('userId') || 'user_' + Date.now(),
        name: localStorage.getItem('userName') || 'John Doe',
        email: localStorage.getItem('userEmail') || 'user@example.com',
        avatar: localStorage.getItem('userAvatar') || 'JD'
    },

    // Notifications
    notifications: JSON.parse(localStorage.getItem('notifications') || '[]'),
    
    // Messages
    conversations: JSON.parse(localStorage.getItem('conversations') || '[]'),

    // Initialize app
    init() {
        this.setupHeader();
        this.setupNavigation();
        this.setupNotifications();
        this.setupMessaging();
        this.setupActiveNavigation();
        this.loadFinancialData();
        this.bindFinancialEvents();
        this.loadEventsData();
        this.bindEventHandlers();
        this.loadStoriesData();
        this.loadLiveStreams();
        console.log('App initialized');
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
                <span class="user-info">${this.user.name}</span>
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

        // Update badge
        this.updateNotificationBadge();

        // Close panel on outside click
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

        // Update badge
        this.updateMessagingBadge();

        // Close panel on outside click
        document.addEventListener('click', (e) => {
            const panel = document.querySelector('.messaging-panel');
            if (panel && !panel.contains(e.target) && !messagingBtn.contains(e.target)) {
                panel.classList.remove('active');
            }
        });
    },

    // Toggle notifications panel
    toggleNotificationsPanel() {
        const panel = document.querySelector('.notifications-panel');
        const messagingPanel = document.querySelector('.messaging-panel');
        if (messagingPanel) messagingPanel.classList.remove('active');
        panel.classList.toggle('active');
    },

    // Toggle messaging panel
    toggleMessagingPanel() {
        const panel = document.querySelector('.messaging-panel');
        const notificationsPanel = document.querySelector('.notifications-panel');
        if (notificationsPanel) notificationsPanel.classList.remove('active');
        panel.classList.toggle('active');
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

        // Show toast
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
        const unreadMessages = this.conversations.filter(c => c.unread).length;
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
                <div class="conversation-avatar">${conv.name.charAt(0).toUpperCase()}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${conv.name}</div>
                    <div class="conversation-preview">${conv.lastMessage}</div>
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
            alert(`Opening conversation with ${conv.name}`);
        }
    },

    // Send message
    sendMessage(message) {
        if (!message.trim()) return;

        const inputField = document.querySelector('.messaging-input input');
        if (inputField) {
            inputField.value = '';
        }

        this.addNotification(`New message sent: "${message}"`, 'success');
    },

    // Financial transactions + calendar
    financialTransactions: JSON.parse(localStorage.getItem('financialTransactions') || '[]'),
    selectedMonth: new Date().toISOString().slice(0, 7),
    finFilter: 'all', // 'all', 'income', 'outcome'
    finSortBy: 'date-desc', // 'date-asc', 'date-desc', 'amount-asc', 'amount-desc'
    finViewMode: 'table', // 'table' or 'list'
    finSearchTerm: '',

    bindFinancialEvents() {
        const addBtn = document.getElementById('addFinBtn');
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.preventDefault();
                this.addFinancialTransaction();
            };
        }

        const monthInput = document.getElementById('finMonth');
        if (monthInput) {
            monthInput.value = this.selectedMonth;
            monthInput.onchange = (e) => {
                this.selectedMonth = e.target.value;
                this.renderFinancialCalendar();
            };
        }

        // Filter buttons
        const filterAll = document.getElementById('finFilterAll');
        const filterIncome = document.getElementById('finFilterIncome');
        const filterOutcome = document.getElementById('finFilterOutcome');
        
        if (filterAll) {
            filterAll.onclick = () => {
                this.finFilter = 'all';
                this.updateFilterButtonStyles();
                this.renderFinancialList();
            };
        }
        if (filterIncome) {
            filterIncome.onclick = () => {
                this.finFilter = 'income';
                this.updateFilterButtonStyles();
                this.renderFinancialList();
            };
        }
        if (filterOutcome) {
            filterOutcome.onclick = () => {
                this.finFilter = 'outcome';
                this.updateFilterButtonStyles();
                this.renderFinancialList();
            };
        }

        // Sort dropdown
        const sortBy = document.getElementById('finSortBy');
        if (sortBy) {
            sortBy.onchange = (e) => {
                this.finSortBy = e.target.value;
                this.renderFinancialList();
            };
        }

        // Search input
        const searchInput = document.getElementById('finSearchInput');
        if (searchInput) {
            searchInput.oninput = (e) => {
                this.finSearchTerm = e.target.value.toLowerCase();
                this.renderFinancialList();
            };
        }

        // View toggle buttons
        const viewTableBtn = document.getElementById('finViewTableBtn');
        const viewListBtn = document.getElementById('finViewListBtn');
        if (viewTableBtn) {
            viewTableBtn.onclick = () => {
                this.finViewMode = 'table';
                this.updateViewButtonStyles();
                this.renderFinancialList();
            };
        }
        if (viewListBtn) {
            viewListBtn.onclick = () => {
                this.finViewMode = 'list';
                this.updateViewButtonStyles();
                this.renderFinancialList();
            };
        }
    },

    loadFinancialData() {
        this.financialTransactions = JSON.parse(localStorage.getItem('financialTransactions') || '[]');
        this.renderFinancialCalendar();
        this.updateFilterButtonStyles();
        this.updateViewButtonStyles();
    },

    saveFinancialData() {
        localStorage.setItem('financialTransactions', JSON.stringify(this.financialTransactions));
        this.renderFinancialCalendar();
    },

    addFinancialTransaction() {
        const date = document.getElementById('finDate').value;
        const description = document.getElementById('finDescr').value.trim();
        const amount = parseFloat(document.getElementById('finAmount').value);
        const type = document.getElementById('finType').value;

        if (!date || !description || isNaN(amount)) {
            this.addNotification('Please fill out all fields with valid values.', 'error');
            return;
        }

        const transaction = {
            id: 'fin_' + Date.now(),
            date,
            description,
            amount: Number(amount.toFixed(2)),
            type,
            createdAt: new Date().toISOString()
        };

        this.financialTransactions.push(transaction);
        this.saveFinancialData();

        // clear form
        document.getElementById('finDate').value = '';
        document.getElementById('finDescr').value = '';
        document.getElementById('finAmount').value = '';
        document.getElementById('finType').value = 'income';

        this.addNotification('Financial entry added.', 'success');
    },

    deleteFinancialTransaction(id) {
        this.financialTransactions = this.financialTransactions.filter(tx => tx.id !== id);
        this.saveFinancialData();
        this.addNotification('Entry removed.', 'info');
    },

    renderFinancialCalendar() {
        const incomeTotal = this.financialTransactions
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const outcomeTotal = this.financialTransactions
            .filter(tx => tx.type === 'outcome')
            .reduce((sum, tx) => sum + tx.amount, 0);

        const balance = incomeTotal - outcomeTotal;

        const lblIncome = document.getElementById('finIncome');
        const lblOutcome = document.getElementById('finOutcome');
        const lblBalance = document.getElementById('finBalance');

        if (lblIncome) lblIncome.textContent = `$${incomeTotal.toFixed(2)}`;
        if (lblOutcome) lblOutcome.textContent = `$${outcomeTotal.toFixed(2)}`;
        if (lblBalance) lblBalance.textContent = `$${balance.toFixed(2)}`;

        this.renderMonthlySummary();
        this.renderFinancialCalendarGrid();
        this.renderSpendingChart();
        this.renderFinancialList();
    },

    getFilteredAndSortedTransactions() {
        let filtered = this.financialTransactions;

        // Apply type filter
        if (this.finFilter === 'income') {
            filtered = filtered.filter(tx => tx.type === 'income');
        } else if (this.finFilter === 'outcome') {
            filtered = filtered.filter(tx => tx.type === 'outcome');
        }

        // Apply search filter
        if (this.finSearchTerm) {
            filtered = filtered.filter(tx => 
                tx.description.toLowerCase().includes(this.finSearchTerm) ||
                tx.date.includes(this.finSearchTerm)
            );
        }

        // Apply sorting
        const sorted = [...filtered];
        switch(this.finSortBy) {
            case 'date-asc':
                sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'date-desc':
                sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'amount-asc':
                sorted.sort((a, b) => a.amount - b.amount);
                break;
            case 'amount-desc':
                sorted.sort((a, b) => b.amount - a.amount);
                break;
        }

        return sorted;
    },

    renderFinancialList() {
        const tableContainer = document.getElementById('finTableViewContainer');
        const listContainer = document.getElementById('finListViewContainer');
        const tableBody = document.getElementById('finTableBody');
        const listBody = document.getElementById('finListBody');

        if (!tableBody || !listBody) return;

        const transactions = this.getFilteredAndSortedTransactions();

        // Render table view
        if (transactions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="padding:10px; color:#888; text-align: center;">No transactions found.</td></tr>';
            listBody.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">No transactions found.</div>';
        } else {
            tableBody.innerHTML = transactions.map(tx => `
                <tr style="border-bottom:1px solid #eee; hover: {background: #f5f5f5;}">
                    <td style="padding:10px;">${tx.date}</td>
                    <td style="padding:10px;">${tx.description}</td>
                    <td style="padding:10px;">
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; background: ${tx.type === 'income' ? '#d4edda' : '#f8d7da'}; color: ${tx.type === 'income' ? '#155724' : '#721c24'};">
                            ${tx.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                    </td>
                    <td style="padding:10px; font-weight: 600; color: ${tx.type === 'income' ? '#28a745' : '#dc3545'};">${tx.type === 'income' ? '+' : '-'}$${tx.amount.toFixed(2)}</td>
                    <td style="padding:10px;"><button class="btn btn-secondary" style="padding:4px 8px; font-size: 11px;" onclick="App.deleteFinancialTransaction('${tx.id}')">Delete</button></td>
                </tr>
            `).join('');

            // Render list view (cards)
            listBody.innerHTML = transactions.map(tx => `
                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <div style="font-size: 12px; color: #666; font-weight: 500;">${tx.date}</div>
                            <div style="font-size: 16px; font-weight: 600; color: #333; margin-top: 4px;">${tx.description}</div>
                        </div>
                        <span style="padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${tx.type === 'income' ? '#d4edda' : '#f8d7da'}; color: ${tx.type === 'income' ? '#155724' : '#721c24'};">
                            ${tx.type === 'income' ? '✓ Income' : '✗ Expense'}
                        </span>
                    </div>
                    <div style="border-top: 1px solid #eee; padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 22px; font-weight: 700; color: ${tx.type === 'income' ? '#28a745' : '#dc3545'};">
                            ${tx.type === 'income' ? '+' : '-'}$${tx.amount.toFixed(2)}
                        </div>
                        <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="App.deleteFinancialTransaction('${tx.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        }

        // Show/hide containers based on view mode
        if (this.finViewMode === 'table') {
            tableContainer.style.display = 'block';
            listContainer.style.display = 'none';
        } else {
            tableContainer.style.display = 'none';
            listContainer.style.display = 'block';
        }
    },

    updateFilterButtonStyles() {
        const btnAll = document.getElementById('finFilterAll');
        const btnIncome = document.getElementById('finFilterIncome');
        const btnOutcome = document.getElementById('finFilterOutcome');

        [btnAll, btnIncome, btnOutcome].forEach(btn => {
            if (btn) {
                btn.style.background = 'white';
                btn.style.color = '#333';
                btn.style.borderWidth = '1px';
            }
        });

        if (this.finFilter === 'all' && btnAll) {
            btnAll.style.background = '#6c757d';
            btnAll.style.color = 'white';
            btnAll.style.borderWidth = '2px';
        } else if (this.finFilter === 'income' && btnIncome) {
            btnIncome.style.background = '#28a745';
            btnIncome.style.color = 'white';
            btnIncome.style.borderWidth = '2px';
        } else if (this.finFilter === 'outcome' && btnOutcome) {
            btnOutcome.style.background = '#dc3545';
            btnOutcome.style.color = 'white';
            btnOutcome.style.borderWidth = '2px';
        }
    },

    updateViewButtonStyles() {
        const btnTable = document.getElementById('finViewTableBtn');
        const btnList = document.getElementById('finViewListBtn');

        if (btnTable) {
            if (this.finViewMode === 'table') {
                btnTable.style.background = '#007bff';
                btnTable.style.color = 'white';
                btnTable.style.borderColor = '#007bff';
            } else {
                btnTable.style.background = 'white';
                btnTable.style.color = '#333';
                btnTable.style.borderColor = '#ddd';
            }
        }

        if (btnList) {
            if (this.finViewMode === 'list') {
                btnList.style.background = '#007bff';
                btnList.style.color = 'white';
                btnList.style.borderColor = '#007bff';
            } else {
                btnList.style.background = 'white';
                btnList.style.color = '#333';
                btnList.style.borderColor = '#ddd';
            }
        }
    },

    renderMonthlySummary() {
        const [year, month] = (this.selectedMonth || new Date().toISOString().slice(0,7)).split('-');
        const raw = this.financialTransactions.filter(tx => {
            const d = new Date(tx.date);
            return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
        });

        const incomeTotal = raw.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
        const outcomeTotal = raw.filter(tx => tx.type === 'outcome').reduce((sum, tx) => sum + tx.amount, 0);
        const balance = incomeTotal - outcomeTotal;

        const lblIncome = document.getElementById('finMonthIncome');
        const lblOutcome = document.getElementById('finMonthOutcome');
        const lblBalance = document.getElementById('finMonthBalance');

        if (lblIncome) lblIncome.textContent = `$${incomeTotal.toFixed(2)}`;
        if (lblOutcome) lblOutcome.textContent = `$${outcomeTotal.toFixed(2)}`;
        if (lblBalance) lblBalance.textContent = `$${balance.toFixed(2)}`;
    },

    renderFinancialCalendarGrid() {
        const container = document.getElementById('finCalendarGrid');
        if (!container) return;

        const [year, month] = (this.selectedMonth || new Date().toISOString().slice(0,7)).split('-');
        const firstDay = new Date(Number(year), Number(month)-1, 1);
        const lastDay = new Date(Number(year), Number(month), 0);

        const cells = [];
        const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        dayNames.forEach(name => cells.push(`<div style="padding:4px;font-weight:bold;text-align:center;">${name}</div>`));

        for (let i = 0; i < firstDay.getDay(); i++) {
            cells.push('<div></div>');
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateStr = `${year}-${month.padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const todays = this.financialTransactions.filter(tx => tx.date === dateStr);
            const income = todays.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
            const outcome = todays.filter(tx => tx.type === 'outcome').reduce((sum, tx) => sum + tx.amount, 0);

            cells.push(`
                <div style="background:#fff; border:1px solid #ddd; border-radius:4px; min-height:60px; padding:4px; font-size:12px;">
                    <div style="font-weight:600;">${d}</div>
                    ${income ? `<div style="color:#2a9d8f;">+${income.toFixed(2)}</div>` : ''}
                    ${outcome ? `<div style="color:#e76f51;">-${outcome.toFixed(2)}</div>` : ''}
                </div>
            `);
        }

        container.innerHTML = cells.join('');
    },

    renderSpendingChart() {
        const chart = document.getElementById('finChart');
        if (!chart) return;

        const [year, month] = (this.selectedMonth || new Date().toISOString().slice(0,7)).split('-');
        const bucket = Array(12).fill(0);
        const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            const dateNo = String(i).padStart(2,'0');
            const dayStr = `${year}-${month.padStart(2,'0')}-${dateNo}`;
            const total = this.financialTransactions
                .filter(tx => tx.date === dayStr && tx.type === 'outcome')
                .reduce((sum, tx) => sum + tx.amount, 0);
            bucket[i-1] = total;
        }

        const max = Math.max(...bucket, 10);
        chart.innerHTML = bucket.map((val, idx) => `
            <div style="flex:1; display:flex; align-items:flex-end; justify-content:center;">
                <div title="${idx+1}: $${val.toFixed(2)}" style="background:#e76f51; width:100%; max-width:14px; height:${(val/max)*100}%"></div>
            </div>
        `).join('');
    },
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

    // ============= EVENTS FUNCTIONALITY =============
    
    // Events data
    events: [],
    myHostedEvents: [],
    myAttendingEvents: [],
    selectedInvitees: [],
    apiBaseUrl: 'http://localhost:3000/api',
    
    loadEventsData() {
        this.fetchEvents();
    },

    bindEventHandlers() {
        // Create event button
        const createBtn = document.getElementById('createEventBtn');
        if (createBtn) {
            createBtn.onclick = () => {
                this.selectedInvitees = [];
                document.getElementById('eventForm').reset();
                document.getElementById('invitedUsersList').innerHTML = '';
                document.getElementById('eventModal').classList.add('active');
            };
        }

        // Tab navigation
        const discoverTab = document.getElementById('eventsDiscoverTab');
        const myTab = document.getElementById('eventsMyTab');
        if (discoverTab) {
            discoverTab.onclick = () => {
                this.showEventTab('discover');
            };
        }
        if (myTab) {
            myTab.onclick = () => {
                this.showEventTab('my');
            };
        }

        // Search and filter
        const searchInput = document.getElementById('eventSearchInput');
        if (searchInput) {
            searchInput.oninput = (e) => this.filterAndRenderEvents();
        }

        const filterType = document.getElementById('eventFilterType');
        if (filterType) {
            filterType.onchange = (e) => this.filterAndRenderEvents();
        }
    },

    async fetchEvents() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${this.apiBaseUrl}/events`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.events = data.events || [];
                this.renderDiscoverEvents();
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    },

    async fetchMyEvents() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${this.apiBaseUrl}/events/hosted/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.myHostedEvents = data.events || [];
                this.renderMyEvents();
            }
        } catch (err) {
            console.error('Error fetching hosted events:', err);
        }
    },

    showEventTab(tab) {
        const discoverContainer = document.getElementById('eventsDiscoverContainer');
        const myContainer = document.getElementById('eventsMyContainer');
        const discoverTab = document.getElementById('eventsDiscoverTab');
        const myTab = document.getElementById('eventsMyTab');

        if (tab === 'discover') {
            discoverContainer.style.display = 'block';
            myContainer.style.display = 'none';
            discoverTab.style.color = '#007bff';
            discoverTab.style.borderBottomColor = '#007bff';
            myTab.style.color = '#666';
            myTab.style.borderBottomColor = 'transparent';
            this.fetchEvents();
        } else {
            discoverContainer.style.display = 'none';
            myContainer.style.display = 'block';
            discoverTab.style.color = '#666';
            discoverTab.style.borderBottomColor = 'transparent';
            myTab.style.color = '#007bff';
            myTab.style.borderBottomColor = '#007bff';
            this.fetchMyEvents();
        }
    },

    filterAndRenderEvents() {
        const searchTerm = document.getElementById('eventSearchInput').value.toLowerCase();
        const filterType = document.getElementById('eventFilterType').value;

        let filtered = this.events.filter(event => {
            const matchesSearch = event.name.toLowerCase().includes(searchTerm) || 
                                event.location.toLowerCase().includes(searchTerm);
            const matchesType = !filterType || event.event_type === filterType;
            return matchesSearch && matchesType;
        });

        this.renderDiscoverEventsList(filtered);
    },

    renderDiscoverEvents() {
        this.filterAndRenderEvents();
    },

    renderDiscoverEventsList(events) {
        const container = document.getElementById('discoverEventsList');
        if (!container) return;

        if (events.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">No events found.</div>';
            return;
        }

        container.innerHTML = events.map(event => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const typeColor = event.event_type === 'public' ? '#007bff' : '#6c757d';
            const userRsvp = event.user_rsvp_status || 'invited';

            return `
                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s;" onclick="App.viewEventDetails('${event.id}')">
                    <div style="padding: 15px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <h4 style="margin: 0; color: #333; font-size: 16px;">${event.name}</h4>
                            <span style="background: ${typeColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                                ${event.event_type.toUpperCase()}
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                            <div>📅 ${formattedDate} at ${event.time}</div>
                            <div>📍 ${event.location}</div>
                        </div>
                        <div style="font-size: 12px; color: #888;">👤 Hosted by ${event.host_name}</div>
                        <div style="font-size: 12px; color: #0066cc;">👥 ${event.attendee_count || 0} attending</div>
                    </div>
                    <div style="padding: 10px 15px; background: #f8f9fa;">
                        ${event.description ? `<p style="margin: 0; font-size: 12px; color: #666; font-style: italic;">${event.description.substring(0, 80)}...</p>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderMyEvents() {
        const hostedContainer = document.getElementById('myHostedEventsList');
        const attendingContainer = document.getElementById('myAttendingEventsList');

        if (hostedContainer) {
            if (this.myHostedEvents.length === 0) {
                hostedContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #888;">No hosted events yet. <a href="#" onclick="App.createEvent(); return false;" style="color: #007bff;">Create one</a></div>';
            } else {
                hostedContainer.innerHTML = this.myHostedEvents.map(event => this.createEventCard(event, true)).join('');
            }
        }

        if (attendingContainer) {
            if (this.myAttendingEvents.length === 0) {
                attendingContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #888;">You\'re not attending any events yet.</div>';
            } else {
                attendingContainer.innerHTML = this.myAttendingEvents.map(event => this.createEventCard(event, false)).join('');
            }
        }
    },

    createEventCard(event, isHosted) {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const typeColor = event.event_type === 'public' ? '#007bff' : '#6c757d';

        return `
            <div style="background: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s;" onclick="App.viewEventDetails('${event.id}')">
                <div style="padding: 15px; border-bottom: 1px solid #eee;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #333; font-size: 16px;">${event.name}</h4>
                        <span style="background: ${typeColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                            ${isHosted ? 'HOSTING' : 'ATTENDING'}
                        </span>
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        <div>📅 ${formattedDate} at ${event.time}</div>
                        <div>📍 ${event.location}</div>
                        <div>👥 ${event.attendee_count || 0} attendees</div>
                    </div>
                </div>
                ${isHosted ? `<div style="padding: 10px 15px; background: #f8f9fa; display: flex; gap: 5px;">
                    <button class="btn btn-secondary" style="font-size: 11px; padding: 4px 8px; flex: 1;" onclick="event.stopPropagation(); App.editEvent('${event.id}');">Edit</button>
                    <button class="btn btn-secondary" style="font-size: 11px; padding: 4px 8px; flex: 1;" onclick="event.stopPropagation(); App.deleteEvent('${event.id}');">Delete</button>
                </div>` : ''}
            </div>
        `;
    },

    viewEventDetails(eventId) {
        this.fetchEventDetails(eventId);
    },

    async fetchEventDetails(eventId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${this.apiBaseUrl}/events/${eventId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayEventDetails(data.event, data.attendees);
            }
        } catch (err) {
            console.error('Error fetching event details:', err);
        }
    },

    displayEventDetails(event, attendees) {
        const modal = document.getElementById('eventDetailModal');
        const title = document.getElementById('eventDetailTitle');
        const content = document.getElementById('eventDetailContent');

        title.textContent = event.name;

        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const isHost = event.host_id === this.user.id;
        const userAttendee = attendees.find(a => a.user_id === this.user.id);

        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="font-weight: 600; color: #666;">Date & Time</label>
                        <div style="font-size: 16px; color: #333; margin-top: 5px;">📅 ${formattedDate}</div>
                        <div style="font-size: 16px; color: #333;">🕐 ${event.time}</div>
                    </div>
                    <div>
                        <label style="font-weight: 600; color: #666;">Location</label>
                        <div style="font-size: 16px; color: #333; margin-top: 5px;">📍 ${event.location}</div>
                    </div>
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="font-weight: 600; color: #666;">Type & Capacity</label>
                    <div style="display: flex; gap: 15px; margin-top: 5px;">
                        <div>
                            <span style="background: ${event.event_type === 'public' ? '#007bff' : '#6c757d'}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: 600;">
                                ${event.event_type.toUpperCase()}
                            </span>
                        </div>
                        ${event.max_attendees ? `<div style="font-size: 14px;">Max: ${event.max_attendees} attendees</div>` : '<div style="font-size: 14px;">Unlimited attendees</div>'}
                    </div>
                </div>

                ${event.description ? `<div style="margin-bottom: 20px;">
                    <label style="font-weight: 600; color: #666;">Description</label>
                    <p style="color: #333; margin-top: 5px; line-height: 1.6;">${event.description}</p>
                </div>` : ''}

                <div style="margin-bottom: 20px; padding: 15px; background: #f0f8ff; border-left: 4px solid #007bff; border-radius: 4px;">
                    <label style="font-weight: 600; color: #333;">Hosted by</label>
                    <div style="margin-top: 8px; display: flex; align-items: center; gap: 10px;">
                        <div style="width: 40px; height: 40px; background: #007bff; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                            ${event.host_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #333;">${event.host_name}</div>
                            ${event.host_location ? `<div style="font-size: 12px; color: #666;">${event.host_location}</div>` : ''}
                        </div>
                    </div>
                </div>

                ${!isHost ? `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 20px;">
                    <button class="btn btn-primary" style="${userAttendee?.rsvp_status === 'accepted' ? 'background: #28a745;' : ''}" onclick="App.rsvpEvent('${event.id}', 'accepted')">✓ Accept</button>
                    <button class="btn btn-secondary" style="${userAttendee?.rsvp_status === 'interested' ? 'background: #ffc107; color: #333;' : ''}" onclick="App.rsvpEvent('${event.id}', 'interested')">? Interested</button>
                    <button class="btn btn-secondary" style="${userAttendee?.rsvp_status === 'declined' ? 'background: #dc3545;color: white;' : ''}" onclick="App.rsvpEvent('${event.id}', 'declined')">✗ Decline</button>
                </div>` : ''}
            </div>

            <div style="border-top: 2px solid #eee; padding-top: 20px;">
                <h4 style="margin: 0 0 15px 0; color: #333;">Attendees (${attendees.length})</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto;">
                    ${attendees.map(att => `
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 32px; height: 32px; background: #007bff; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                                    ${att.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style="font-weight: 600; font-size: 14px; color: #333;">${att.username}</div>
                                    <div style="font-size: 11px; color: #666;">${att.rsvp_status}</div>
                                </div>
                            </div>
                            ${isHost ? `<button class="btn btn-secondary" style="font-size: 10px; padding: 4px 6px;" onclick="App.manageAttendee('${event.id}', '${att.id}', 'accept')">✓</button>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.classList.add('active');
    },

    async rsvpEvent(eventId, status) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${this.apiBaseUrl}/events/${eventId}/rsvp`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rsvp_status: status })
            });

            if (response.ok) {
                this.showToast(`RSVP updated to ${status}`, 'success');
                this.fetchEventDetails(eventId);
            }
        } catch (err) {
            console.error('Error updating RSVP:', err);
        }
    },

    async manageAttendee(eventId, attendeeId, action) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${this.apiBaseUrl}/events/${eventId}/attendees/${attendeeId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            if (response.ok) {
                this.showToast('Attendee updated', 'success');
                this.fetchEventDetails(eventId);
            }
        } catch (err) {
            console.error('Error managing attendee:', err);
        }
    },

    async handleCreateEvent(e) {
        if (e) e.preventDefault();

        const name = document.getElementById('eventName').value;
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const location = document.getElementById('eventLocation').value;
        const description = document.getElementById('eventDescription').value;
        const event_type = document.getElementById('eventType').value;
        const max_attendees = document.getElementById('eventMaxAttendees').value;

        if (!name || !date || !time || !location) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.showToast('Please login first', 'error');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    date,
                    time,
                    location,
                    description,
                    event_type,
                    max_attendees: max_attendees || null
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.showToast('Event created successfully!', 'success');

                // Invite users if any selected
                if (this.selectedInvitees.length > 0 && data.eventId) {
                    await this.inviteUsersToEvent(data.eventId, this.selectedInvitees.map(u => u.id));
                }

                closeEventModal();
                this.loadEventsData();
            } else {
                this.showToast('Failed to create event', 'error');
            }
        } catch (err) {
            console.error('Error creating event:', err);
            this.showToast('Error creating event', 'error');
        }
    },

    async searchUsersForEvent(searchTerm) {
        if (searchTerm.length < 1) {
            document.getElementById('userSearchResults').innerHTML = '';
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${this.apiBaseUrl}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Filter users locally based on search term
                const filtered = data.users.filter(user => 
                    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                const results = document.getElementById('userSearchResults');
                results.innerHTML = filtered.map(user => `
                    <div style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" 
                         onmouseover="this.style.background='#f0f0f0'" onmouseout="this.style.background='white'"
                         onclick="App.addInvitee({id: '${user.id}', username: '${user.username || user.full_name}'})">
                        <span>${user.username || user.full_name}</span>
                        <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;">+ Add</button>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error('Error searching users:', err);
        }
    },

    addInvitee(user) {
        if (!this.selectedInvitees.find(u => u.id === user.id)) {
            this.selectedInvitees.push(user);
            this.renderInvitedUsers();
            document.getElementById('userSearchInput').value = '';
            document.getElementById('userSearchResults').innerHTML = '';
        }
    },

    removeInvitee(userId) {
        this.selectedInvitees = this.selectedInvitees.filter(u => u.id !== userId);
        this.renderInvitedUsers();
    },

    renderInvitedUsers() {
        const container = document.getElementById('invitedUsersList');
        if (this.selectedInvitees.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div style="margin-top: 10px; padding: 10px; background: #f0f8ff; border-radius: 4px;">
                <div style="font-size: 12px; font-weight: 600; color: #333; margin-bottom: 8px;">Invited Users (${this.selectedInvitees.length}):</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${this.selectedInvitees.map(user => `
                        <span style="background: #007bff; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 6px;">
                            ${user.username}
                            <button style="background: none; border: none; color: white; cursor: pointer; font-weight: bold;" onclick="App.removeInvitee('${user.id}')">×</button>
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    },

    async inviteUsersToEvent(eventId, userIds) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${this.apiBaseUrl}/events/${eventId}/invite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userIds })
            });

            if (response.ok) {
                this.showToast('Invites sent!', 'success');
            }
        } catch (err) {
            console.error('Error inviting users:', err);
        }
    },

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            const response = await fetch(`${this.apiBaseUrl}/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                this.showToast('Event deleted', 'success');
                this.fetchMyEvents();
            }
        } catch (err) {
            console.error('Error deleting event:', err);
        }
    },

    editEvent(eventId) {
        this.showToast('Edit feature coming soon', 'info');
    },

    createEvent() {
        document.getElementById('createEventBtn').click();
    },

    // Logout
    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userAvatar');
            localStorage.removeItem('authToken');
            window.location.href = 'signinorup.html';
        }
    },

    // ===== STORIES METHODS =====
    async loadStoriesData() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('No token, skipping story load');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/stories/feed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderStoriesFeed(data);
            } else {
                console.error('Failed to load stories');
            }
        } catch (err) {
            console.error('Error loading stories:', err);
        }
    },

    async createStory(mediaUrl, mediaType, caption, duration) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${this.apiBaseUrl}/stories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    media_url: mediaUrl,
                    media_type: mediaType,
                    caption: caption,
                    duration: parseInt(duration)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create story');
            }

            const data = await response.json();
            this.showToast('Story posted!', 'success');
            return data;
        } catch (err) {
            console.error('Error creating story:', err);
            throw err;
        }
    },

    async viewStory(storyId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await fetch(`${this.apiBaseUrl}/stories/${storyId}/view`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Error viewing story:', err);
        }
    },

    async reactToStory(storyId, reaction) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${this.apiBaseUrl}/stories/${storyId}/react`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reaction })
            });

            if (response.ok) {
                this.showToast('Reaction added!', 'success');
            }
        } catch (err) {
            console.error('Error reacting to story:', err);
        }
    },

    async deleteStory(storyId) {
        try {
            if (!confirm('Delete this story?')) return;

            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${this.apiBaseUrl}/stories/${storyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                this.showToast('Story deleted', 'success');
                this.loadStoriesData();
            }
        } catch (err) {
            console.error('Error deleting story:', err);
        }
    },

    renderStoriesFeed(stories) {
        const container = document.getElementById('storiesContainer');
        if (!container) return;

        if (!stories || stories.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">No stories available. Follow more people to see their stories!</div>';
            return;
        }

        container.innerHTML = stories.map(story => `
            <div style="border: 2px solid #eee; border-radius: 8px; padding: 10px; cursor: pointer; position: relative; overflow: hidden;">
                <img src="${story.media_url}" alt="Story" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px;">
                <div style="padding: 8px; font-size: 12px; color: #666;">
                    <div style="font-weight: bold; overflow: hidden; text-overflow: ellipsis;">${story.caption || 'Untitled'}</div>
                    <div style="margin-top: 4px; font-size: 10px;">👁 ${story.view_count || 0} views</div>
                    <button onclick="App.viewStory('${story.id}')" style="margin-top: 8px; width: 100%; padding: 4px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">View</button>
                </div>
            </div>
        `).join('');
    },

    // ===== LIVE STREAMS METHODS =====
    async loadLiveStreams() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('No token, skipping stream load');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/streams/live`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const liveStreams = await response.json();
                this.renderLiveStreams(liveStreams);
            }

            // Load replays
            const replayResponse = await fetch(`${this.apiBaseUrl}/streams/broadcasts/recent`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (replayResponse.ok) {
                const replays = await replayResponse.json();
                this.renderStreamReplays(replays);
            }
        } catch (err) {
            console.error('Error loading streams:', err);
        }
    },

    async goLive(title, description, thumbnail, scheduledTime) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Not authenticated');

            const body = {
                title,
                description,
                thumbnail_url: thumbnail,
                status: scheduledTime ? 'scheduled' : 'live'
            };

            if (scheduledTime) {
                body.scheduled_for = new Date(scheduledTime).toISOString();
            }

            const response = await fetch(`${this.apiBaseUrl}/streams`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error('Failed to start stream');
            }

            const data = await response.json();
            this.showToast(scheduledTime ? 'Stream scheduled!' : 'You are now live!', 'success');
            return data;
        } catch (err) {
            console.error('Error starting stream:', err);
            throw err;
        }
    },

    async joinStream(streamId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${this.apiBaseUrl}/streams/${streamId}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                this.showToast('Joined stream!', 'success');
            }
        } catch (err) {
            console.error('Error joining stream:', err);
        }
    },

    async leaveStream(streamId) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await fetch(`${this.apiBaseUrl}/streams/${streamId}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error('Error leaving stream:', err);
        }
    },

    async commentOnStream(streamId, comment) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${this.apiBaseUrl}/streams/${streamId}/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment })
            });

            if (response.ok) {
                this.showToast('Comment sent!', 'success');
                return await response.json();
            }
        } catch (err) {
            console.error('Error commenting on stream:', err);
            throw err;
        }
    },

    async sendGiftToStream(streamId, giftName, giftValue) {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${this.apiBaseUrl}/streams/${streamId}/gift`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gift_name: giftName, gift_value: giftValue })
            });

            if (response.ok) {
                this.showToast('Gift sent!', 'success');
            }
        } catch (err) {
            console.error('Error sending gift:', err);
        }
    },

    async endStream(streamId) {
        try {
            if (!confirm('End this stream?')) return;

            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch(`${this.apiBaseUrl}/streams/${streamId}/end`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                this.showToast('Stream ended', 'success');
                this.loadLiveStreams();
            }
        } catch (err) {
            console.error('Error ending stream:', err);
        }
    },

    renderLiveStreams(streams) {
        const container = document.getElementById('liveStreamsList');
        if (!container) return;

        if (!streams || streams.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">No live streams. Follow streamers to see their broadcasts!</div>';
            return;
        }

        container.innerHTML = streams.map(stream => `
            <div style="border: 2px solid #eee; border-radius: 8px; overflow: hidden; background: #f9f9f9;">
                <div style="position: relative; background: #000; height: 160px; display: flex; align-items: center; justify-content: center; text-align: center;">
                    ${stream.thumbnail_url ? `<img src="${stream.thumbnail_url}" alt="Stream" style="width: 100%; height: 100%; object-fit: cover;">` : '<div style="color: #666;">Live Stream</div>'}
                    <div style="position: absolute; top: 8px; right: 8px; background: red; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;">🔴 LIVE</div>
                    <div style="position: absolute; bottom: 8px; left: 8px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">👁 ${stream.viewer_count || 0} watching</div>
                </div>
                <div style="padding: 12px;">
                    <div style="font-weight: bold; overflow: hidden; text-overflow: ellipsis;">${stream.title}</div>
                    <div style="font-size: 12px; color: #666; margin: 4px 0;">${stream.description || 'No description'}</div>
                    <button onclick="App.joinStream('${stream.id}')" style="width: 100%; margin-top: 8px; padding: 8px; background: #ff0000; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: bold;">Join Stream</button>
                </div>
            </div>
        `).join('');
    },

    renderStreamReplays(replays) {
        const container = document.getElementById('streamRepliesList');
        if (!container) return;

        if (!replays || replays.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">No stream replays available yet</div>';
            return;
        }

        container.innerHTML = replays.map(replay => `
            <div style="border: 2px solid #eee; border-radius: 8px; overflow: hidden; background: #f9f9f9;">
                <div style="position: relative; background: #000; height: 160px; display: flex; align-items: center; justify-content: center; text-align: center;">
                    ${replay.thumbnail_url ? `<img src="${replay.thumbnail_url}" alt="Replay" style="width: 100%; height: 100%; object-fit: cover;">` : '<div style="color: #666;">Stream Replay</div>'}
                    <div style="position: absolute; top: 8px; right: 8px; background: #666; color: white; padding: 4px 8px; border-radius: 3px; font-size: 12px;">📹 REPLAY</div>
                </div>
                <div style="padding: 12px;">
                    <div style="font-weight: bold; overflow: hidden; text-overflow: ellipsis;">${replay.title}</div>
                    <div style="font-size: 12px; color: #666; margin: 4px 0;">Max viewers: ${replay.max_viewers || 0}</div>
                    <button onclick="alert('Replay feature coming soon')" style="width: 100%; margin-top: 8px; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 3px; cursor: pointer;">Watch Replay</button>
                </div>
            </div>
        `).join('');
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
