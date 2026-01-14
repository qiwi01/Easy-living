import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const MessageBoard = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatSettings, setChatSettings] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
    fetchChatSettings();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setMessages([]);
      const response = await api.get('/messages');
      setMessages(response.data);
    } catch (err) {
      // Don't show error if user hasn't joined a house yet
      if (err.response?.status !== 400) {
        console.error('Failed to fetch messages:', err);
      }
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatSettings = async () => {
    try {
      // Get house info which includes chat settings
      const response = await api.get('/house/my-house');
      setChatSettings(response.data.chatSettings);
      setIsAdmin(response.data.adminId === user?.id);
    } catch (err) {
      // Don't show error if user hasn't joined a house yet
      if (err.response?.status !== 400) {
        console.error('Failed to fetch chat settings:', err);
      }
      setChatSettings(null);
      setIsAdmin(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await api.post('/messages', {
        content: newMessage,
        type: 'message'
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(err.response?.data?.msg || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sendAnnouncement = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await api.post('/messages', {
        content: newMessage,
        type: 'announcement'
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send announcement:', err);
      alert(err.response?.data?.msg || 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  const updateChatSettings = async (settings) => {
    try {
      await api.put('/messages/settings', settings);
      setChatSettings(prev => ({ ...prev, ...settings }));
      setSettingsOpen(false);
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Failed to update chat settings');
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await api.delete(`/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const messageDate = new Date(date);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return messageDate.toLocaleDateString();
  };

  const canSendMessage = () => {
    if (!chatSettings) return true;
    return chatSettings.allowEveryoneToPost || isAdmin;
  };

  if (loading) {
    return (
      <div className="message-board">
        <div className="loading">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="message-board">
      <div className="message-board-header">
        <div className="header-info">
          <h1>Message Board</h1>
          <p>Chat with your house members</p>
        </div>

        {isAdmin && (
          <div className="header-actions">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="btn-secondary"
            >
              ⚙️ Settings
            </button>
          </div>
        )}
      </div>

      {settingsOpen && isAdmin && (
        <div className="chat-settings">
          <h3>Chat Settings</h3>
          <div className="settings-options">
            <label>
              <input
                type="checkbox"
                checked={chatSettings?.allowEveryoneToPost || false}
                onChange={(e) => updateChatSettings({ allowEveryoneToPost: e.target.checked })}
              />
              Allow everyone to post messages
            </label>
            <label>
              <input
                type="checkbox"
                checked={chatSettings?.announcementsEnabled || false}
                onChange={(e) => updateChatSettings({ announcementsEnabled: e.target.checked })}
              />
              Enable announcements
            </label>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="btn-secondary"
          >
            Close Settings
          </button>
        </div>
      )}

      <div className="messages-container">
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="no-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showDateSeparator = !prevMessage ||
                formatDate(message.createdAt) !== formatDate(prevMessage.createdAt);

              const isOwnMessage = message.senderId._id === user?.id;

              return (
                <React.Fragment key={message._id}>
                  {showDateSeparator && (
                    <div className="date-separator">
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                  )}

                  <div className={`message-item ${message.isAnnouncement ? 'announcement' : ''} ${isOwnMessage ? 'own' : ''}`}>
                    <div className="message-header">
                      <span className="sender-name">
                        {message.senderId.email.split('@')[0]}
                        {message.isAnnouncement && ' 📢'}
                      </span>
                      <span className="message-time">
                        {formatTime(message.createdAt)}
                      </span>
                      {(isAdmin || isOwnMessage) && (
                        <button
                          onClick={() => deleteMessage(message._id)}
                          className="delete-message-btn"
                          title="Delete message"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="message-content">
                      {message.content}
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {canSendMessage() ? (
        <div className="message-input-container">
          <form onSubmit={sendMessage} className="message-input-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="message-input"
              maxLength={500}
              disabled={sending}
            />
            <button
              type="submit"
              className="btn-primary send-btn"
              disabled={sending || !newMessage.trim()}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
            {isAdmin && chatSettings?.announcementsEnabled && (
              <button
                type="button"
                onClick={sendAnnouncement}
                className="btn-secondary announcement-btn"
                disabled={sending || !newMessage.trim()}
              >
                📢 Announce
              </button>
            )}
          </form>
        </div>
      ) : (
        <div className="message-restricted">
          <p>💬 Only admins can post messages in this house.</p>
        </div>
      )}
    </div>
  );
};

export default MessageBoard;
