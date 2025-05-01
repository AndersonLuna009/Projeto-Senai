// Variáveis globais
let currentUser = null;
let rooms = [];
let notifications = [];
let reservations = [];

// Elementos DOM comuns
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const notificationCount = document.getElementById('notificationCount');
const toast = document.getElementById('toast');

// Constantes
const API_URL = 'http://localhost:5000/api';

// -------------------- Inicialização --------------------
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkLoggedInUser();
});

function setupEventListeners() {
    // Navegação
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', navigateTo);
    });

    // Login/Logout
    loginBtn.addEventListener('click', openLoginModal);
    logoutBtn.addEventListener('click', logout);
    
    // Modais
    setupModals();
    
    // Formulários
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('reservationForm').addEventListener('submit', handleReservation);
    document.getElementById('addRoomForm').addEventListener('submit', handleAddRoom);
    
    // Filtros
    document.getElementById('applyFilter').addEventListener('click', applyCalendarFilter);
    document.getElementById('adminApplyFilter').addEventListener('click', applyAdminFilter);
    
    // Links específicos
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        closeAllModals();
        openModal('registerModal');
    });
    
    // Botão para adicionar sala
    document.getElementById('addRoomBtn').addEventListener('click', () => {
        openModal('addRoomModal');
    });
    
    // Tabs no painel admin
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', switchTab);
    });
    
    // Filtro de data padrão (hoje)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;
    document.getElementById('adminDateFilter').value = today;
}

// -------------------- Autenticação --------------------
function checkLoggedInUser() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserInterface();
        loadInitialData();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error);
            return;
        }
        
        // Login bem-sucedido
        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('token', data.token);
        
        closeAllModals();
        updateUserInterface();
        loadInitialData();
        showToast('Login realizado com sucesso!');
    } catch (error) {
        showToast('Erro ao fazer login. Tente novamente.');
        console.error('Erro de login:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regPasswordConfirm').value;
    
    if (password !== confirmPassword) {
        showToast('As senhas não coincidem');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error);
            return;
        }
        
        // Registro bem-sucedido
        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('token', data.token);
        
        closeAllModals();
        updateUserInterface();
        loadInitialData();
        showToast('Cadastro realizado com sucesso!');
    } catch (error) {
        showToast('Erro ao cadastrar. Tente novamente.');
        console.error('Erro de registro:', error);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserInterface();
    navigateTo(null, 'calendar');
    showToast('Logout realizado com sucesso!');
}

// -------------------- Interface do Usuário --------------------
function updateUserInterface() {
    if (currentUser) {
        userName.textContent = currentUser.name;
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        
        // Mostrar/esconder elementos baseados no tipo de usuário
        const adminElements = document.querySelectorAll('.admin-only');
        if (currentUser.is_admin) {
            adminElements.forEach(el => el.classList.remove('hidden'));
        } else {
            adminElements.forEach(el => el.classList.add('hidden'));
        }
    } else {
        userName.textContent = 'Não conectado';
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    }
}

function navigateTo(e, sectionId = null) {
    if (e) {
        e.preventDefault();
        sectionId = e.currentTarget.getAttribute('data-section');
    }
    
    // Esconder todas as seções
    document.querySelectorAll('main section').forEach(section => {
        section.classList.remove('active-section');
    });
    
    // Mostrar a seção selecionada
    document.getElementById(sectionId).classList.add('active-section');
    
    // Atualizar navegação ativa
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
    
    // Carregar dados específicos da seção
    switch (sectionId) {
        case 'calendar':
            loadCalendarData();
            break;
        case 'myReservations':
            loadUserReservations();
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'adminPanel':
            loadAdminData();
            break;
    }
}

function switchTab(e) {
    const tabId = e.currentTarget.getAttribute('data-tab');
    
    // Remover classe ativa de todos os botões e conteúdos
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active-tab');
    });
    
    // Ativar o botão e conteúdo selecionados
    e.currentTarget.classList.add('active');
    document.getElementById(tabId).classList.add('active-tab');
    
    // Carregar dados específicos da tab
    switch (tabId) {
        case 'rooms':
            loadAdminRooms();
            break;
        case 'users':
            loadAdminUsers();
            break;
        case 'allReservations':
            loadAdminReservations();
            break;
    }
}

// -------------------- Carregamento de Dados --------------------
async function loadInitialData() {
    if (!currentUser) return;
    
    try {
        // Carregar salas
        const roomsResponse = await fetch(`${API_URL}/rooms`);
        rooms = await roomsResponse.json();
        
        // Preencher seletores de salas
        populateRoomSelectors();
        
        // Carregar notificações
        await loadNotifications();
        
        // Carregar dados do calendário
        loadCalendarData();
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
    }
}

async function loadCalendarData() {
    if (!currentUser) return;
    
    try {
        const date = document.getElementById('dateFilter').value;
        const roomId = document.getElementById('roomFilter').value;
        
        // Carregar reservas para essa data
        const reservationsResponse = await fetch(
            `${API_URL}/reservations?date=${date}${roomId ? '&room_id=' + roomId : ''}`
        );
        
        reservations = await reservationsResponse.json();
        
        // Renderizar grade do calendário
        renderCalendarGrid();
    } catch (error) {
        console.error('Erro ao carregar dados do calendário:', error);
    }
}

async function loadUserReservations() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_URL}/reservations?user_id=${currentUser.id}`);
        const userReservations = await response.json();

        const container = document.getElementById('userReservations');
        const myReservationsDot = document.getElementById('myReservationsDot');
        container.innerHTML = '';

        if (userReservations.length === 0) {
            container.innerHTML = '<p class="no-data">Você não tem reservas.</p>';
            myReservationsDot.classList.add('hidden');
            return;
        }

        // Mostra o 🔴 se houver reservas
        myReservationsDot.classList.remove('hidden');

        const reservationsByDate = {};
        userReservations.forEach(reservation => {
            if (!reservationsByDate[reservation.date]) {
                reservationsByDate[reservation.date] = [];
            }
            reservationsByDate[reservation.date].push(reservation);
        });

        const sortedDates = Object.keys(reservationsByDate).sort();

        sortedDates.forEach(date => {
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';

            const dateHeader = document.createElement('h3');
            dateHeader.textContent = formatDate(date);
            dateGroup.appendChild(dateHeader);

            reservationsByDate[date].forEach(reservation => {
                const reservationCard = createReservationCard(reservation);
                dateGroup.appendChild(reservationCard);
            });

            container.appendChild(dateGroup);
        });
    } catch (error) {
        console.error('Erro ao carregar reservas do usuário:', error);
    }
}



async function loadNotifications() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/notifications?user_id=${currentUser.id}`);
        notifications = await response.json();
        
        // Atualizar contador de notificações
        const unreadCount = notifications.filter(n => !n.is_read).length;
        notificationCount.textContent = unreadCount > 0 ? unreadCount : '0';
        
        // Se estiver na seção de notificações, renderizar lista
        if (document.getElementById('notifications').classList.contains('active-section')) {
            const container = document.getElementById('notificationsList');
            container.innerHTML = '';
            
            if (notifications.length === 0) {
                container.innerHTML = '<p class="no-data">Você não tem notificações.</p>';
                return;
            }
            
            notifications.forEach(notification => {
                const notificationItem = document.createElement('div');
                notificationItem.className = `notification-item ${notification.is_read ? 'read' : 'unread'}`;
                
                notificationItem.innerHTML = `
                    <div class="notification-content">${notification.message}</div>
                    <div class="notification-date">${formatDateTime(notification.created_at)}</div>
                `;
                
                if (!notification.is_read) {
                    const markAsReadBtn = document.createElement('button');
                    markAsReadBtn.className = 'mark-read-btn';
                    markAsReadBtn.textContent = 'Marcar como lida';
                    markAsReadBtn.addEventListener('click', () => markNotificationAsRead(notification.id));
                    notificationItem.appendChild(markAsReadBtn);
                }
                
                container.appendChild(notificationItem);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
    }
}

// -------------------- Painel Admin --------------------
async function loadAdminData() {
    if (!currentUser || !currentUser.is_admin) return;
    
    // Por padrão, carregar a primeira tab (salas)
    await loadAdminRooms();
    
    // Carregar usuários para o filtro
    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        
        const userSelector = document.getElementById('adminUserFilter');
        userSelector.innerHTML = '<option value="">Todos os usuários</option>';
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            userSelector.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

async function loadAdminRooms() {
    if (!currentUser || !currentUser.is_admin) return;
    
    try {
        const response = await fetch(`${API_URL}/rooms`);
        rooms = await response.json();
        
        const container = document.getElementById('adminRoomsList');
        container.innerHTML = '';
        
        rooms.forEach(room => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            
            const features = [];
            if (room.features.projector) features.push('Projetor');
            if (room.features.whiteboard) features.push('Quadro Branco');
            if (room.features.videoconf) features.push('Videoconferência');
            
            roomCard.innerHTML = `
            <h4>${room.name}</h4>
            <div class="room-details">
                <p><strong>Capacidade:</strong> ${room.capacity} pessoas</p>
                <p><strong>Recursos:</strong> ${features.join(', ') || 'Nenhum'}</p>
            </div>
            <button class="delete-room-btn" data-room-id="${room.id}">Excluir</button>
        `;
        
        container.appendChild(roomCard);
    });

    // Adicionar eventos aos botões de excluir
    document.querySelectorAll('.delete-room-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const roomId = e.target.getAttribute('data-room-id');
            if (confirm('Tem certeza que deseja excluir esta sala?')) {
                await deleteRoom(roomId);
            }
        });
    });

} catch (error) {
    console.error('Erro ao carregar salas:', error);
}
}

// Função para deletar a sala
async function deleteRoom(roomId) {
try {
    const response = await fetch(`${API_URL}/rooms/${roomId}`, {
        method: 'DELETE'
    });
    const data = await response.json();
    
    if (data.success) {
        showToast('Sala excluída com sucesso!');
        loadAdminRooms();
        populateRoomSelectors();
    } else {
        showToast(data.error || 'Erro ao excluir sala.');
    }
} catch (error) {
    console.error('Erro ao excluir sala:', error);
    showToast('Erro ao excluir sala.');
}
}

async function loadAdminUsers() {
    if (!currentUser || !currentUser.is_admin) return;
    
    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        
        const container = document.getElementById('adminUsersList');
        container.innerHTML = '';
        
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            
            userCard.innerHTML = `
                <h4>${user.name}</h4>
                <div class="user-details">
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Tipo:</strong> ${user.is_admin ? 'Administrador' : 'Usuário'}</p>
                </div>
            `;
            
            container.appendChild(userCard);
        });
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

async function loadAdminReservations() {
    if (!currentUser || !currentUser.is_admin) return;
    
    try {
        const date = document.getElementById('adminDateFilter').value;
        const roomId = document.getElementById('adminRoomFilter').value;
        const userId = document.getElementById('adminUserFilter').value;
        
        let url = `${API_URL}/reservations?`;
        if (date) url += `date=${date}&`;
        if (roomId) url += `room_id=${roomId}&`;
        if (userId) url += `user_id=${userId}&`;
        
        const response = await fetch(url);
        const adminReservations = await response.json();
        
        const container = document.getElementById('adminReservationsList');
        container.innerHTML = '';
        
        if (adminReservations.length === 0) {
            container.innerHTML = '<p class="no-data">Nenhuma reserva encontrada.</p>';
            return;
        }
        
        adminReservations.forEach(reservation => {
            const reservationCard = createReservationCard(reservation, true);
            container.appendChild(reservationCard);
        });
    } catch (error) {
        console.error('Erro ao carregar reservas:', error);
    }
}

// -------------------- Funcionalidades do Calendário --------------------
function renderCalendarGrid() {
    const roomsGrid = document.getElementById('roomsGrid');
    roomsGrid.innerHTML = '';

    const roomFilter = document.getElementById('roomFilter').value;
    const filteredRooms = roomFilter ? rooms.filter(room => room.id == roomFilter) : rooms;

    const headerRow = document.createElement('div');
    headerRow.className = 'room-row header-row';

    filteredRooms.forEach(room => {
        const roomHeader = document.createElement('div');
        roomHeader.className = 'room-header';
        roomHeader.textContent = room.name;
        headerRow.appendChild(roomHeader);
    });

    roomsGrid.appendChild(headerRow);

    // Aqui definimos os horários disponíveis
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    timeSlots.forEach(timeSlot => {
        const timeRow = document.createElement('div');
        timeRow.className = 'room-row';

        filteredRooms.forEach(room => {
            const slot = document.createElement('div');
            slot.className = 'time-slot-cell';
            slot.setAttribute('data-room', room.id);
            slot.setAttribute('data-time', timeSlot);

            const date = document.getElementById('dateFilter').value;

            let reserved = false;
            let reservationInfo = null;

            for (const reservation of reservations) {
                if (reservation.room_id == room.id && reservation.date === date) {
                    const start = convertTimeToMinutes(reservation.start_time);
                    const end = start + (parseInt(reservation.duration) * 60); // duração em minutos
                    const slotTime = convertTimeToMinutes(timeSlot);

                    if (slotTime >= start && slotTime <= end) {
                        reserved = true;
                        reservationInfo = reservation;
                        break;
                    }
                }
            }

            if (reserved) {
                slot.classList.add('reserved');

                if (currentUser && reservationInfo.user_id == currentUser.id) {
                    slot.classList.add('my-reservation');
                }

                // Mostrar info apenas na célula inicial
                if (timeSlot === reservationInfo.start_time) {
                    slot.innerHTML = `
                        <div class="reservation-info">
                            <strong>${reservationInfo.title}</strong>
                            <span>${reservationInfo.user_name}</span>
                            <span>${reservationInfo.start_time} - ${getEndTime(reservationInfo.start_time, reservationInfo.duration)}</span>
                        </div>
                    `;
                }

                slot.addEventListener('click', () => showReservationDetails(reservationInfo));
            } else {
                if (currentUser) {
                    slot.innerHTML = '<div class="add-reservation">+</div>';
                    slot.addEventListener('click', () => openNewReservation(room, date, timeSlot));
                }
            }

            timeRow.appendChild(slot);
        });

        roomsGrid.appendChild(timeRow);
    });
}

// Funções auxiliares
function convertTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}

function getEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = (hours * 60) + minutes + (parseInt(duration) * 60);
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
}



function applyCalendarFilter() {
    loadCalendarData();
}

function applyAdminFilter() {
    loadAdminReservations();
}

function openNewReservation(room, date, startTime) {
    // Preencher dados do formulário
    document.getElementById('reservationRoom').textContent = room.name;
    document.getElementById('reservationDate').textContent = formatDate(date);
    document.getElementById('reservationStart').textContent = startTime;
    
    // Armazenar dados para submissão
    const form = document.getElementById('reservationForm');
    form.setAttribute('data-room-id', room.id);
    form.setAttribute('data-date', date);
    form.setAttribute('data-start-time', startTime);
    
    // Abrir modal
    openModal('newReservationModal');
}

async function handleReservation(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showToast('Você precisa estar logado para fazer uma reserva');
        return;
    }
    
    const form = e.target;
    const roomId = form.getAttribute('data-room-id');
    const date = form.getAttribute('data-date');
    const startTime = form.getAttribute('data-start-time');
    const duration = document.getElementById('reservationDuration').value;
    const title = document.getElementById('reservationTitle').value;
    const description = document.getElementById('reservationDescription').value;
    
    try {
        const response = await fetch(`${API_URL}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                room_id: roomId,
                title,
                description,
                date,
                start_time: startTime,
                duration
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error);
            return;
        }
        
        closeAllModals();
        showToast('Reserva realizada com sucesso!');
        loadCalendarData();
        
    } catch (error) {
        console.error('Erro ao fazer reserva:', error);
        showToast('Erro ao fazer reserva. Tente novamente.');
    }

    loadUserReservations(); // para atualizar o 🔴

}

async function handleAddRoom(e) {
    e.preventDefault();
    
    if (!currentUser || !currentUser.is_admin) {
        showToast('Apenas administradores podem adicionar salas');
        return;
    }
    
    const name = document.getElementById('roomName').value;
    const capacity = document.getElementById('roomCapacity').value;
    const features = {
        projector: document.getElementById('hasProjector').checked,
        whiteboard: document.getElementById('hasWhiteboard').checked,
        videoconf: document.getElementById('hasVideoConf').checked
    };
    
    try {
        const response = await fetch(`${API_URL}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, capacity, features })
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error);
            return;
        }
        
        closeAllModals();
        showToast('Sala adicionada com sucesso!');
        loadAdminRooms();
        populateRoomSelectors();
        
    } catch (error) {
        console.error('Erro ao adicionar sala:', error);
        showToast('Erro ao adicionar sala. Tente novamente.');
    }
}

async function cancelReservation(reservationId) {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/reservations/${reservationId}?user_id=${currentUser.id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error);
            return;
        }
        
        showToast('Reserva cancelada com sucesso!');
        loadCalendarData();
        loadUserReservations();
        
    } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        showToast('Erro ao cancelar reserva. Tente novamente.');
    }
}

function showReservationDetails(reservation) {
    // Implementar um modal de detalhes ou tooltip
    alert(`
        Título: ${reservation.title}
        Descrição: ${reservation.description || 'Sem descrição'}
        Sala: ${reservation.room_name}
        Data: ${formatDate(reservation.date)}
        Horário: ${reservation.start_time} - ${getEndTime(reservation.start_time, reservation.duration)}
        Reservado por: ${reservation.user_name}
    `);
}

// -------------------- Utilitários --------------------

function createReservationCard(reservation, isAdmin = false) {
    const card = document.createElement('div');
    card.className = 'reservation-card';
    
    card.innerHTML = `
        <div class="reservation-header">
            <h4>
                <span class="red-dot" title="Reserva ativa"></span>
                ${reservation.title}
            </h4>
            <span class="reservation-time">${reservation.start_time} - ${getEndTime(reservation.start_time, reservation.duration)}</span>
        </div>
        <div class="reservation-details">
            <p><strong>Sala:</strong> ${reservation.room_name}</p>
            ${isAdmin ? `<p><strong>Usuário:</strong> ${reservation.user_name}</p>` : ''}
            ${reservation.description ? `<p><strong>Descrição:</strong> ${reservation.description}</p>` : ''}
        </div>
    `;
    
    if ((currentUser && reservation.user_id == currentUser.id) || (currentUser && currentUser.is_admin)) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancelar Reserva';
        cancelBtn.addEventListener('click', () => cancelReservation(reservation.id));
        card.appendChild(cancelBtn);
    }
    
    return card;
}



function populateRoomSelectors() {
    // Preencher seletor de salas no calendário
    const roomFilter = document.getElementById('roomFilter');
    roomFilter.innerHTML = '<option value="">Todas as salas</option>';
    
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = room.name;
        roomFilter.appendChild(option);
    });
    
    // Preencher seletor de salas no painel admin
    const adminRoomFilter = document.getElementById('adminRoomFilter');
    adminRoomFilter.innerHTML = '<option value="">Todas as salas</option>';
    
    rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = room.name;
        adminRoomFilter.appendChild(option);
    });
}

async function markNotificationAsRead(notificationId) {
    if (!currentUser) return;
    
    try {
        await fetch(`${API_URL}/notifications/${notificationId}/read?user_id=${currentUser.id}`, {
            method: 'POST'
        });
        
        // Recarregar notificações
        loadNotifications();
        
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
    }
}

// -------------------- Manipulação de Modais --------------------
function setupModals() {
    // Fechar modal ao clicar no X
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeAllModals();
        });
    });
    
    // Fechar modal ao clicar fora dele
    window.addEventListener('click', e => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function openLoginModal() {
    openModal('loginModal');
}

// -------------------- Utilitários de Formatação --------------------
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR')}`;
}

function getEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + parseInt(duration);
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// -------------------- Notificações Toast --------------------
function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}