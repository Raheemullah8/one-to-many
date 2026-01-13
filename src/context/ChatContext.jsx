import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

axios.defaults.baseURL = API_BASE_URL;

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    });
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [notification, setNotification] = useState([]);
    const [themeMode, setThemeMode] = useState(() => {
        const savedTheme = localStorage.getItem('themeMode');
        return savedTheme || 'light';
    });

    useEffect(() => {
        if (user) {
            const newSocket = io(SOCKET_URL);
            setSocket(newSocket);
            newSocket.emit('add-user', user._id);
            return () => {
                newSocket.disconnect();
            };
        } else {
            setSocket(null);
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            socket.on('online-users', (users) => {
                setOnlineUsers(users);
            });

            socket.on('receive-message', (newMessage) => {
                if (selectedChat && selectedChat._id === newMessage.chat._id) {
                    setMessages([...messages, newMessage]);
                } else {
                    setNotification([...notification, newMessage]);
                }
            });

            return () => {
                socket.off('online-users');
                socket.off('receive-message');
            };
        }
    }, [socket, selectedChat, messages, notification]);

    const toggleTheme = useCallback(() => {
        setThemeMode((prevMode) => {
            const newMode = prevMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('themeMode', newMode);
            return newMode;
        });
    }, []);

    const fetchChats = useCallback(async () => {
        if (!user?.token) return;
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get('/api/chat', config);
            setChats(data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        }
    }, [user?.token]);

    const sendMessage = async (content, chatId, messageType = 'text', fileUrl = '') => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.post(
                '/api/chat/message',
                { content, chatId, messageType, fileUrl },
                config
            );

            socket.emit('send-message', {
                ...data,
                receiverId: selectedChat.users.find(u => u._id !== user._id)?._id
            });

            setMessages([...messages, data]);

            // Update latest message in chat
            setChats(chats.map(chat =>
                chat._id === chatId ? { ...chat, latestMessage: data } : chat
            ));
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const value = useMemo(() => ({
        user,
        setUser,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        messages,
        setMessages,
        onlineUsers,
        socket,
        notification,
        setNotification,
        fetchChats,
        sendMessage,
        themeMode,
        toggleTheme,
    }), [user, chats, selectedChat, messages, onlineUsers, socket, notification, fetchChats, sendMessage, themeMode, toggleTheme]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
