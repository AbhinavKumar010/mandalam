import React, { useState, useEffect, useRef } from 'react';
import './DirectChat.css';
import { Smile, Info, ArrowLeft, Search, Check, CheckCheck } from 'lucide-react';
import io from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import BottomNav from '../components/BottomNav';
import API, { SOCKET_URL } from '../api/axios';

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});

export default function DirectChat() {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const chatBottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Deterministic 1-on-1 Room ID
  const getRoomId = (otherUserId) => {
    if (!currentUser._id || !otherUserId) return null;
    return [currentUser._id, otherUserId].sort().join('__');
  };

  const activeRoomId = activeChat ? getRoomId(activeChat._id) : null;

  // 1. Fetch available chat contacts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await API.get('/chat/users');
        setUsers(data);
        if (data.length > 0) setActiveChat(data[0]);
      } catch (err) {
        console.error('Failed to load chat users:', err);
      }
    };
    fetchUsers();
  }, []);

  // 2. Load conversation history & handle room socket events
  useEffect(() => {
    if (!activeRoomId) return;

    socket.emit('join_room', activeRoomId);

    // Tell server to mark incoming unread messages as read
    socket.emit('mark_as_read', {
      roomId: activeRoomId,
      userId: currentUser._id,
    });

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const { data } = await API.get(`/chat/${activeRoomId}`);
        const formatted = data.map((m) => ({
          _id: m._id,
          roomId: m.roomId,
          senderId: (m.sender?._id || m.sender).toString(),
          senderName: m.sender?.username || 'User',
          text: m.text,
          read: m.read,
          createdAt: m.createdAt,
        }));
        setMessages(formatted);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();

    // Listen for incoming messages
    const handleReceive = (incoming) => {
      if (incoming.roomId === activeRoomId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === incoming._id)) return prev;
          return [...prev, incoming];
        });

        // If I am viewing this room and someone else sent the message, mark it as read immediately
        if (incoming.senderId !== currentUser._id) {
          socket.emit('mark_as_read', {
            roomId: activeRoomId,
            userId: currentUser._id,
          });
        }
      }
    };

    // Listen for typing events
    const handleUserTyping = ({ userId }) => {
      if (userId !== currentUser._id) setIsOtherTyping(true);
    };

    const handleUserStopTyping = ({ userId }) => {
      if (userId !== currentUser._id) setIsOtherTyping(false);
    };

    // Listen for read receipts
    const handleMessagesRead = ({ roomId, readerId }) => {
      if (roomId === activeRoomId && readerId !== currentUser._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.senderId === currentUser._id ? { ...msg, read: true } : msg
          )
        );
      }
    };

    socket.on('receive_message', handleReceive);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [activeRoomId, currentUser._id]);

  // Keep scroll anchored to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  // Handle typing input changes with debouncing
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!activeRoomId) return;

    // Emit typing start
    socket.emit('typing', {
      roomId: activeRoomId,
      userId: currentUser._id,
      username: currentUser.username,
    });

    // Reset existing stop timer
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Emit stop typing after 1.5s of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', {
        roomId: activeRoomId,
        userId: currentUser._id,
      });
    }, 1500);
  };

  // Send Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeRoomId || !activeChat) return;

    // Clear typing timeout immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('stop_typing', { roomId: activeRoomId, userId: currentUser._id });

    const payload = {
      roomId: activeRoomId,
      senderId: currentUser._id,
      recipientId: activeChat._id,
      text: input.trim(),
    };

    socket.emit('send_message', payload);
    setInput('');
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="direct-chat-page">
      <Sidebar />

      <div className="chat-shell">
        {/* Left: Contact List */}
        <div
          className={`chat-shell__contacts ${mobileShowChat ? 'chat-shell__contacts--hidden-mobile' : ''}`}
        >
          <div className="chat-contacts__heading">
            <h2 className="chat-contacts__title">{currentUser.username || 'Chats'}</h2>
          </div>

          <div className="chat-contacts__search-wrap">
            <div className="chat-contacts__search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="chat-contacts__list">
            {filteredUsers.length === 0 ? (
              <p className="chat-contacts__empty">No users found</p>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = activeChat?._id === user._id;
                return (
                  <div
                    key={user._id}
                    onClick={() => {
                      setActiveChat(user);
                      setIsOtherTyping(false);
                      setMobileShowChat(true);
                    }}
                    className={`chat-contact ${isSelected ? 'chat-contact--selected' : ''}`}
                  >
                    <Avatar src={user.profilePic} name={user.username} alt={user.username} className="chat-contact__avatar" />
                    <div className="chat-contact__details">
                      <span className="chat-contact__username">{user.username}</span>
                      <span className="chat-contact__name">{user.fullName || 'Member'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Window */}
        <div
          className={`chat-conversation ${!mobileShowChat ? 'chat-conversation--hidden-mobile' : ''}`}
        >
          {activeChat ? (
            <>
              {/* Top Banner */}
              <div className="chat-conversation__header">
                <div className="chat-conversation__identity">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="chat-conversation__back"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <Avatar src={activeChat.profilePic} name={activeChat.username} alt={activeChat.username} className="chat-conversation__avatar" />
                  <div className="chat-conversation__user">
                    <span className="chat-conversation__username">{activeChat.username}</span>
                    <span className="chat-conversation__status">
                      {isOtherTyping ? (
                        <span className="chat-conversation__typing-label">typing...</span>
                      ) : (
                        activeChat.fullName
                      )}
                    </span>
                  </div>
                </div>
                <Info size={18} className="chat-conversation__info" />
              </div>

              {/* Chat Thread */}
              <div className="chat-thread">
                {loadingHistory ? (
                  <div className="chat-thread__loading">
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-thread__empty">
                    <Avatar src={activeChat.profilePic} name={activeChat.username} alt={activeChat.username} className="chat-thread__empty-avatar" />
                    <h4 className="chat-thread__empty-title">{activeChat.fullName}</h4>
                    <p className="chat-thread__empty-copy">Send a message to start chatting.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === currentUser._id;
                    const timeFormatted = m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div
                        key={m._id}
                        className={`chat-message ${isMe ? 'chat-message--outgoing' : 'chat-message--incoming'}`}
                      >
                        <div
                          className="chat-message__bubble"
                        >
                          {m.text}
                        </div>

                        {/* Timestamp & Read Receipt */}
                        <div className="chat-message__meta">
                          {timeFormatted && (
                            <span className="chat-message__time">{timeFormatted}</span>
                          )}
                          {isMe && (
                            <span>
                              {m.read ? (
                                <CheckCheck size={12} className="chat-message__receipt--read" title="Read" />
                              ) : (
                                <Check size={12} className="chat-message__receipt--delivered" title="Delivered" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Animated Typing Bubble */}
                {isOtherTyping && (
                  <div className="chat-typing">
                    <span className="chat-typing__dot" />
                    <span className="chat-typing__dot" />
                    <span className="chat-typing__dot" />
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Composer */}
              <form
                onSubmit={handleSendMessage}
                className="chat-composer"
              >
                <Smile size={20} />
                <input
                  type="text"
                  placeholder="Message..."
                  value={input}
                  onChange={handleInputChange}
                />
                {input.trim() && (
                  <button type="submit" className="chat-composer__send">
                    Send
                  </button>
                )}
              </form>
            </>
          ) : (
            <div className="chat-conversation__prompt">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}