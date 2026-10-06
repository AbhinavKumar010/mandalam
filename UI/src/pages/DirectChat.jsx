import React, { useState, useEffect, useRef } from 'react';
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
    <div className="flex h-[calc(100dvh-3rem)] bg-white dark:bg-black text-black dark:text-white overflow-hidden md:h-screen">
      <Sidebar />

      <div className="flex-1 flex max-w-[975px] mx-auto md:my-4 md:border md:border-neutral-200 md:dark:border-neutral-800 md:rounded-xl overflow-hidden shadow-sm h-full md:h-[calc(100vh-2rem)]">
        {/* Left: Contact List */}
        <div
          className={`w-full md:w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-black ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-bold text-base tracking-tight">{currentUser.username || 'Chats'}</h2>
          </div>

          <div className="p-3 border-b border-neutral-100 dark:border-neutral-900">
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded-lg">
              <Search size={16} className="text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs outline-none w-full placeholder-neutral-500 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-center text-neutral-400 p-4">No users found</p>
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
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-neutral-100 dark:bg-neutral-900'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                    }`}
                  >
                    <Avatar src={user.profilePic} name={user.username} alt={user.username} className="h-12 w-12 border border-neutral-200 dark:border-neutral-800" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold truncate">{user.username}</span>
                      <span className="text-xs text-neutral-500 truncate">{user.fullName || 'Member'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Window */}
        <div
          className={`flex-1 flex flex-col justify-between bg-neutral-50 dark:bg-neutral-950 ${
            !mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeChat ? (
            <>
              {/* Top Banner */}
              <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden text-neutral-600 dark:text-neutral-300 mr-1"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <Avatar src={activeChat.profilePic} name={activeChat.username} alt={activeChat.username} className="h-9 w-9" />
                  <div>
                    <span className="font-semibold text-xs block">{activeChat.username}</span>
                    <span className="text-[10px] text-neutral-400">
                      {isOtherTyping ? (
                        <span className="text-blue-500 font-medium">typing...</span>
                      ) : (
                        activeChat.fullName
                      )}
                    </span>
                  </div>
                </div>
                <Info size={18} className="text-neutral-500 cursor-pointer" />
              </div>

              {/* Chat Thread */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2.5">
                {loadingHistory ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
                    Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
                    <Avatar src={activeChat.profilePic} name={activeChat.username} alt={activeChat.username} className="mb-2 h-16 w-16 text-lg" />
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">{activeChat.fullName}</h4>
                    <p className="text-xs text-neutral-500 mt-1">Send a message to start chatting.</p>
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
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] md:max-w-sm px-4 py-2 rounded-2xl text-xs break-words shadow-sm ${
                            isMe
                              ? 'bg-blue-500 text-white rounded-br-sm'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-sm'
                          }`}
                        >
                          {m.text}
                        </div>

                        {/* Timestamp & Read Receipt */}
                        <div className="flex items-center gap-1 mt-0.5 px-1">
                          {timeFormatted && (
                            <span className="text-[9px] text-neutral-400">{timeFormatted}</span>
                          )}
                          {isMe && (
                            <span>
                              {m.read ? (
                                <CheckCheck size={12} className="text-blue-500" title="Read" />
                              ) : (
                                <Check size={12} className="text-neutral-400" title="Delivered" />
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
                  <div className="flex items-center gap-1.5 bg-neutral-200 dark:bg-neutral-800 px-3 py-2 rounded-2xl w-14 rounded-bl-none self-start mt-1">
                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Composer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5"
              >
                <Smile size={20} className="text-neutral-400 cursor-pointer" />
                <input
                  type="text"
                  placeholder="Message..."
                  value={input}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent text-xs outline-none placeholder-neutral-500 text-neutral-900 dark:text-white"
                />
                {input.trim() && (
                  <button type="submit" className="text-xs font-semibold text-blue-500 hover:text-blue-700">
                    Send
                  </button>
                )}
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-neutral-400">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}