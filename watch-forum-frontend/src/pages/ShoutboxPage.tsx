// ============================================
// SHOUTBOX PAGE — global live chat
// Messages now come from the backend (MongoDB),
// so EVERY logged-in user sees the same conversation.
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useShoutboxStore } from '@/stores/shoutboxStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Send, Users, MessageSquare, Crown, Shield, Clock, Trash2 } from 'lucide-react';

interface MessageProps {
  message: {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    authorRole: 'user' | 'admin' | 'owner';
    timestamp: string;
  };
  isCurrentUser: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isCurrentUser }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const isSystem = message.authorId === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-[80%]">
          <p className="text-sm text-blue-800 text-center">{message.content}</p>
          <p className="text-xs text-blue-500 text-center mt-1">{formatTime(message.timestamp)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={message.authorAvatar} />
        <AvatarFallback
          className={
            message.authorRole === 'owner'
              ? 'bg-yellow-500 text-white'
              : message.authorRole === 'admin'
              ? 'bg-red-600 text-white'
              : 'bg-gray-300'
          }
        >
          {message.authorName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={`max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-center gap-2 mb-1">
          <Link to={`/profile/${message.authorName}`} className="text-sm font-medium hover:text-blue-600">
            {message.authorName}
          </Link>
          {message.authorRole === 'owner' && (
            <Badge className="bg-yellow-500 text-black text-[10px] px-1">
              <Crown className="h-3 w-3 mr-0.5" />
              Owner
            </Badge>
          )}
          {message.authorRole === 'admin' && (
            <Badge className="bg-red-600 text-white text-[10px] px-1">
              <Shield className="h-3 w-3 mr-0.5" />
              Admin
            </Badge>
          )}
          <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
        </div>

        <div
          className={`px-3 py-2 rounded-lg ${
            isCurrentUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    </div>
  );
};

export const ShoutboxPage: React.FC = () => {
  const { messages, sendMessage, canSendMessage, clearMessages, init, stop } = useShoutboxStore();
  const { currentUser, isAuthenticated, isOwner } = useAuthStore();

  const [inputMessage, setInputMessage] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState({ remaining: 10, secondsUntilReset: 0 });
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start polling on mount, stop on unmount
  useEffect(() => {
    init();
    return () => { stop(); };
  }, [init, stop]);

  useEffect(() => {
    const updateRateLimit = () => {
      const info = canSendMessage();
      setRateLimitInfo({ remaining: info.remaining, secondsUntilReset: info.secondsUntilReset });
    };
    updateRateLimit();
    const interval = setInterval(updateRateLimit, 1000);
    return () => clearInterval(interval);
  }, [canSendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated) inputRef.current?.focus();
  }, [isAuthenticated]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isAuthenticated || !currentUser) {
      setStatus({ type: 'error', message: 'Please log in to send messages' });
      return;
    }
    if (!inputMessage.trim() || sending) return;
    setSending(true);
    const result = await sendMessage(inputMessage, currentUser);
    setSending(false);
    if (result.success) {
      setInputMessage('');
      setStatus(null);
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to send message' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onlineUsers = [...new Set(messages.map((m) => m.authorName))].filter((n) => n !== 'System');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                Shoutbox
              </h1>
              <p className="text-gray-600">Live chat with the community</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">{onlineUsers.length} active</span>
              </div>
              {isOwner() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Clear all messages? This cannot be undone.')) clearMessages();
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="py-3 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Live Chat
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {messages.length}/100 messages
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No messages yet. Be the first to say hello!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <Message
                        key={message.id}
                        message={message}
                        isCurrentUser={message.authorId === currentUser?.id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>

              <div className="p-4 border-t bg-gray-50">
                {status && (
                  <Alert
                    className={`mb-3 ${
                      status.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <AlertDescription className={status.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                      {status.message}
                    </AlertDescription>
                  </Alert>
                )}

                {!isAuthenticated ? (
                  <div className="text-center py-2">
                    <p className="text-gray-600 mb-2">Log in to join the conversation</p>
                    <Link to="/login">
                      <Button size="sm">Log In</Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        maxLength={500}
                        className="pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {inputMessage.length}/500
                      </span>
                    </div>
                    <Button
                      type="submit"
                      disabled={!inputMessage.trim() || rateLimitInfo.remaining === 0 || sending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                )}

                {isAuthenticated && (
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>
                      {rateLimitInfo.remaining > 0 ? (
                        <>
                          <span className="font-medium text-blue-600">{rateLimitInfo.remaining}</span> messages remaining
                        </>
                      ) : (
                        <span className="text-red-500">
                          Rate limit reached. Wait {rateLimitInfo.secondsUntilReset}s
                        </span>
                      )}
                    </span>
                    <span>Max 10 messages per 15 seconds</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recent Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {onlineUsers.slice(-10).map((username, index) => (
                    <Link
                      key={index}
                      to={`/profile/${username}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-gray-300">
                          {username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">{username}</span>
                    </Link>
                  ))}
                  {onlineUsers.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">No users yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Be respectful to others</li>
                  <li>• No spam or advertising</li>
                  <li>• Keep it watch-related</li>
                  <li>• Max 10 messages per 15 seconds</li>
                  <li>• Last 100 messages are kept</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoutboxPage;
