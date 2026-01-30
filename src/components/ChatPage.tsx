import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Conversation {
  id: number;
  userId: number;
  status: string;
  lastMessageAt: string | null;
  unreadCount?: number;
  user: {
    id: number;
    email: string;
  };
  messages: Array<{
    id: number;
    content: string | null;
    imageUrl: string | null;
    senderType: string;
  }>;
  _count: {
    messages: number;
  };
}

interface Message {
  id: number;
  senderId: number;
  senderType: 'user' | 'admin';
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  isRead: boolean;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [uploading, setUploading] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedConversationRef = useRef<number | null>(null);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Initialize socket
  useEffect(() => {
    // Use environment variable for socket URL, fallback to localhost for development
    const socketUrl = import.meta.env.PUBLIC_SOCKET_URL || 
      (process.env.NODE_ENV === 'production'
        ? 'https://app-trader.railway.internal'
        : 'http://localhost:3000');

    const newSocket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('Admin connected to socket');
      
      // Re-join conversation room if one is selected
      if (selectedConversation) {
        newSocket.emit('join-conversation', {
          conversationId: selectedConversation,
          isAdmin: true,
        });
        console.log('CMS re-joined conversation room on connect:', selectedConversation);
      }
    });

    const handleNewMessage = (message: Message & { conversationId?: number }) => {
      console.log('CMS received new-message:', message);
      
      // Check if message is for currently selected conversation using ref
      const currentConv = selectedConversationRef.current;
      
      // Always update conversation list when new message arrives
      loadConversations();
      
      // Only add to messages if it's for the currently selected conversation
      if (message.conversationId === currentConv) {
        console.log('Message is for current conversation, adding to messages');
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates by ID)
          const exists = prev.some((m) => m.id === message.id);
          if (exists) {
            console.log('Message already exists, skipping');
            return prev;
          }
          
          // Check if there's a temp message (from optimistic update) that should be replaced
          // Temp messages have very large IDs (Date.now()), real messages have small sequential IDs
          const tempMessageIndex = prev.findIndex((m) => 
            m.id > 1000000000000 && // Temp ID is timestamp (larger than any real DB ID)
            m.senderType === message.senderType &&
            m.senderId === message.senderId &&
            ((m.content === message.content && message.content) || 
             (m.imageUrl === message.imageUrl && message.imageUrl)) &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000 // Within 5 seconds
          );
          
          if (tempMessageIndex !== -1) {
            // Replace temp message with real message from DB
            const newMessages = [...prev];
            newMessages[tempMessageIndex] = message;
            setTimeout(() => scrollToBottom(), 100);
            return newMessages;
          }
          
          // Add new message
          console.log('Adding new message to state');
          setTimeout(() => scrollToBottom(), 100);
          return [...prev, message];
        });
      } else {
        console.log('Message is for different conversation:', message.conversationId, 'current:', currentConv);
      }
    };

    newSocket.on('new-message', handleNewMessage);

    newSocket.on('admin-notification', (data: any) => {
      setUnreadTotal((prev) => prev + 1);
      playNotificationSound();
      updateNotificationBadge();
      loadConversations();
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error received:', error);
      alert(`Error: ${error.message || 'Unknown error occurred'}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('new-message', handleNewMessage);
      newSocket.disconnect();
    };
  }, []);

  // Load conversations
  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/chat/conversations?status=${statusFilter}`);
      
      if (!response.ok) {
        console.error('Failed to load conversations:', response.status);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Expected JSON but got:', contentType);
        return;
      }
      
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        console.error('Empty response body');
        return;
      }
      
      const data = JSON.parse(text);
      setConversations(data.data || []);

      const totalUnread = data.data.reduce((sum: number, conv: Conversation) => {
        return sum + (conv.unreadCount || 0);
      }, 0);
      setUnreadTotal(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [statusFilter]);

  // Update ref when selectedConversation changes
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && socket) {
      // Admin can join any conversation without userId validation
      if (socket.connected) {
        socket.emit('join-conversation', { 
          conversationId: selectedConversation,
          isAdmin: true,
        });
        console.log('CMS joined conversation room:', selectedConversation);
      } else {
        console.warn('CMS socket not connected, will join when connected');
        socket.once('connect', () => {
          socket.emit('join-conversation', { 
            conversationId: selectedConversation,
            isAdmin: true,
          });
          console.log('CMS joined conversation room on reconnect:', selectedConversation);
        });
      }
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, socket]);

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}&limit=50`);
      
      if (!response.ok) {
        console.error('Failed to load messages:', response.status);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Expected JSON but got:', contentType);
        return;
      }
      
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        console.error('Empty response body');
        return;
      }
      
      const data = JSON.parse(text);
      setMessages(data.data || []);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const updateNotificationBadge = () => {
    const badge = document.getElementById('chat-notification-badge');
    if (badge) {
      if (unreadTotal > 0) {
        badge.textContent = unreadTotal > 99 ? '99+' : unreadTotal.toString();
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  };

  useEffect(() => {
    updateNotificationBadge();
  }, [unreadTotal]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New message', {
            body: 'You have a new message from a user',
            icon: '/favicon.ico',
          });
        }
      });
    } catch (error) {
      console.error('Error playing notification:', error);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !selectedConversation || !socket) return;

    // Optimistic update: Add message to UI immediately
    const tempMessage: Message = {
      id: Date.now(), // Temporary ID
      senderId: 0,
      senderType: 'admin',
      content: trimmed,
      imageUrl: null,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setInput('');
    scrollToBottom();

    try {
      socket.emit('send-message', {
        conversationId: selectedConversation,
        senderId: 0, // Admin ID
        senderType: 'admin',
        content: trimmed,
        imageUrl: null,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation || !socket) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/chat/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.data?.imageUrl) {
        // Optimistic update for image
        const tempMessage: Message = {
          id: Date.now(),
          senderId: 0,
          senderType: 'admin',
          content: null,
          imageUrl: data.data.imageUrl,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        setMessages((prev) => [...prev, tempMessage]);
        scrollToBottom();

        socket.emit('send-message', {
          conversationId: selectedConversation,
          senderId: 0,
          senderType: 'admin',
          content: null,
          imageUrl: data.data.imageUrl,
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-4">Chat Conversations</h1>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setStatusFilter('OPEN')}
              className={`px-3 py-1 rounded text-sm ${
                statusFilter === 'OPEN' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setStatusFilter('CLOSED')}
              className={`px-3 py-1 rounded text-sm ${
                statusFilter === 'CLOSED' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              Closed
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded text-sm ${
                statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
          {unreadTotal > 0 && (
            <div className="bg-red-500 text-white text-sm px-3 py-1 rounded-full inline-block">
              {unreadTotal} unread
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setSelectedConversation(conv.id)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedConversation === conv.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm">{conv.user.email}</p>
                {conv.unreadCount && conv.unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              {conv.messages[0] && (
                <p className="text-xs text-gray-500 truncate">
                  {conv.messages[0].content || (conv.messages[0].imageUrl ? '📷 Image' : '')}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {conv.lastMessageAt
                  ? new Date(conv.lastMessageAt).toLocaleString()
                  : 'No messages'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="bg-white border-b p-4">
              <h2 className="font-semibold">
                {conversations.find((c) => c.id === selectedConversation)?.user.email}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      msg.senderType === 'admin'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {msg.imageUrl && (
                      <img
                        src={
                          msg.imageUrl.startsWith('http') 
                            ? msg.imageUrl 
                            : msg.imageUrl.startsWith('/uploads/')
                            ? `http://localhost:4321${msg.imageUrl}` // Main app URL for images uploaded from app
                            : msg.imageUrl
                        }
                        alt="Shared"
                        className="max-w-full h-auto rounded-lg mb-2"
                        onError={(e) => {
                          // Fallback: try direct path if main app URL fails
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('localhost:4321')) {
                            target.src = msg.imageUrl || '';
                          }
                        }}
                      />
                    )}
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  📷
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}

