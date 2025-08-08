import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, orderBy, addDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables from the main script
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    // Replace with your actual Firebase config
    apiKey: "AIzaSyCVXKIfGbr6hgQZ4QULRux4clXOqOpl8uQ",
    authDomain: "hhmobile-2c49b.firebaseapp.com",
    projectId: "hhmobile-2c49b",
    storageBucket: "hhmobile-2c49b.firebasestorage.app",
    messagingSenderId: "835670139306",
    appId: "1:835670139306:web:fe78dd9fda7629d9218bd3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let loggedInUser = null;
let currentUserId = null;
let isAdmin = false;

// UI Elements
const chatModal = document.getElementById('chat-modal');
const closeChatModalBtn = document.getElementById('close-chat-modal');
const openChatModalBtn = document.getElementById('open-chat-modal-btn');
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');

// --- Firebase Authentication and Initialization ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        loggedInUser = user;
        currentUserId = user.uid;
        // Check if the user is an admin. Assumes adminEmail is a global variable from script.js
        if (typeof shopDataCache !== 'undefined' && user.email === shopDataCache.adminEmail) {
            isAdmin = true;
        }
        // Start listening for chat messages for the current user
        if (chatModal) {
            setupChatListener();
        }
    } else {
        loggedInUser = null;
        currentUserId = null;
        isAdmin = false;
    }
});

// --- Chat Modal Functions ---
function openChatModal() {
    chatModal.classList.add('active');
    // Scroll to the bottom of the chat window when opened
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function closeChatModal() {
    chatModal.classList.remove('active');
}

// --- Firestore Chat Functions ---
function getChatCollectionRef() {
    if (!currentUserId) {
        return null;
    }
    // Store chat messages in a subcollection under the user's profile
    return collection(db, `artifacts/${appId}/users/${currentUserId}/chats`);
}

function setupChatListener() {
    const chatCollectionRef = getChatCollectionRef();
    if (!chatCollectionRef) return;

    // The orderBy is important to get messages in chronological order
    const q = query(chatCollectionRef, orderBy('timestamp'));

    onSnapshot(q, (snapshot) => {
        chatWindow.innerHTML = ''; // Clear existing messages
        snapshot.forEach((doc) => {
            const message = doc.data();
            displayMessage(message);
        });
        // Scroll to the bottom after new messages are loaded
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, (error) => {
        console.error("Error listening to chat messages: ", error);
        // You might want to show an error notification here
    });
}

async function sendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText === '' || !currentUserId) {
        return;
    }

    const chatCollectionRef = getChatCollectionRef();
    if (!chatCollectionRef) {
        console.error("Chat collection reference is null. User not authenticated.");
        return;
    }

    const message = {
        text: messageText,
        sender: isAdmin ? 'admin' : 'user',
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(chatCollectionRef, message);
        chatInput.value = ''; // Clear input field
    } catch (error) {
        console.error("Error sending message: ", error);
        // Show an error notification to the user
    }
}

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');

    if (message.sender === 'user') {
        messageElement.classList.add('user');
    } else if (message.sender === 'admin') {
        messageElement.classList.add('admin');
    }

    messageElement.textContent = message.text;
    chatWindow.appendChild(messageElement);
}

// --- Event Listeners ---
if (openChatModalBtn) {
    openChatModalBtn.addEventListener('click', () => {
        if (!loggedInUser) {
            // If the user isn't logged in, open the login/register modal instead
            if (typeof openLoginRegisterModal !== 'undefined') {
                openLoginRegisterModal();
                // Optionally show a notification
                if (typeof showNotification !== 'undefined') {
                    showNotification("Vui lòng đăng nhập để bắt đầu cuộc trò chuyện.", "info");
                }
            } else {
                console.warn("Login/Register modal function not found.");
            }
        } else {
            openChatModal();
        }
    });
}

if (closeChatModalBtn) {
    closeChatModalBtn.addEventListener('click', closeChatModal);
}

if (sendChatBtn) {
    sendChatBtn.addEventListener('click', sendMessage);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

