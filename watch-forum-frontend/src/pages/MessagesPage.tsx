// ============================================
// MESSAGES PAGE
// Private messaging system between users
// ============================================

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useMessageStore } from '@/stores/messageStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Send, 
  Mail, 
  Inbox, 
  MessageSquare, 
  Search,
  User,
  Check,
  CheckCheck,
  X
} from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toParam = searchParams.get('to');
  
  const { currentUser, isAuthenticated, getUserByUsername, getAllUsers } = useAuthStore();
  const { 
    sendMessage, 
    getConversations, 
    getMessagesBetweenUsers,
    getUnreadCount,
    markAllAsRead,
    initialize
  } = useMessageStore();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [subjectText, setSubjectText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get all users for recipient selection
  const allUsers = getAllUsers();
  const filteredRecipients = allUsers.filter(u => 
    u.id !== currentUser?.id && 
    !u.isBanned &&
    u.username.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  useEffect(() => {
    if (isAuthenticated) initialize();
  }, [isAuthenticated, initialize]);

  // Handle ?to= parameter from profile
  useEffect(() => {
    if (toParam && currentUser) {
      const recipient = getUserByUsername(toParam);
      if (recipient && recipient.id !== currentUser.id) {
        setSelectedUser(recipient.id);
        setSelectedUsername(recipient.username);
        setIsComposing(true);
        // Clear the URL param
        setSearchParams({});
      }
    }
  }, [toParam, currentUser, getUserByUsername, setSearchParams]);

  const conversations = currentUser ? getConversations(currentUser.id) : [];
  const unreadCount = currentUser ? getUnreadCount(currentUser.id) : 0;

  // Filter conversations by search
  const filteredConversations = conversations.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get messages with selected user
  const selectedMessages = selectedUser && currentUser
    ? getMessagesBetweenUsers(currentUser.id, selectedUser)
    : [];

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser || !currentUser) return;

    const recipient = getUserByUsername(selectedUsername);
    if (!recipient) return;

    await sendMessage({
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      recipientId: recipient.id,
      recipientName: recipient.username,
      subject: subjectText || 'No subject',
      content: messageText,
    });

    setMessageText('');
    setSubjectText('');
    // Stay in conversation view, don't close
    setIsComposing(false);
  };

  // Handle compose new message
  const handleStartCompose = () => {
    setSelectedUser(null);
    setSelectedUsername('');
    setRecipientSearch('');
    setMessageText('');
    setSubjectText('');
    setIsComposing(true);
    setShowRecipientDropdown(false);
  };

  // Handle recipient selection
  const handleSelectRecipient = (userId: string, username: string) => {
    setSelectedUser(userId);
    setSelectedUsername(username);
    setRecipientSearch(username);
    setShowRecipientDropdown(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Select conversation
  const handleSelectConversation = async (userId: string, username: string) => {
    setSelectedUser(userId);
    setSelectedUsername(username);
    if (currentUser) {
      await markAllAsRead(currentUser.id, userId);
    }
    setIsComposing(false);
  };

  // Close compose and go back to conversation list
  const handleCloseCompose = () => {
    setIsComposing(false);
    if (selectedUser) {
      // Stay with selected user
    } else {
      setSelectedUser(null);
      setSelectedUsername('');
    }
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Mail className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view messages.</p>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Mail className="h-8 w-8" />
                Messages
                {unreadCount > 0 && (
                  <Badge className="bg-red-600 text-white">{unreadCount} new</Badge>
                )}
              </h1>
            </div>
            <Button onClick={handleStartCompose}>
              <Send className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Inbox className="h-5 w-5" />
                Conversations
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.userId}
                        onClick={() => handleSelectConversation(conv.userId, conv.username)}
                        className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${
                          selectedUser === conv.userId && !isComposing ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.avatar} />
                          <AvatarFallback>{conv.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{conv.username}</span>
                            <span className="text-xs text-gray-500">{formatDate(conv.lastMessageAt)}</span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                          {conv.unreadCount > 0 && (
                            <Badge className="mt-1 bg-red-600 text-white text-xs">
                              {conv.unreadCount} new
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Thread / Compose */}
          <Card className="md:col-span-2">
            {isComposing ? (
              // Compose New Message
              <>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>New Message</CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleCloseCompose}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recipient Selection with Dropdown */}
                  <div className="relative">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">To</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Type username..."
                        value={recipientSearch}
                        onChange={(e) => {
                          setRecipientSearch(e.target.value);
                          setShowRecipientDropdown(true);
                          // Clear selected if typing changes
                          if (selectedUsername && e.target.value !== selectedUsername) {
                            setSelectedUser(null);
                            setSelectedUsername('');
                          }
                        }}
                        onFocus={() => setShowRecipientDropdown(true)}
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Recipient Dropdown */}
                    {showRecipientDropdown && recipientSearch.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                        {filteredRecipients.length === 0 ? (
                          <div className="p-3 text-sm text-gray-500">No users found</div>
                        ) : (
                          filteredRecipients.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleSelectRecipient(user.id, user.username)}
                              className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 text-left"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{user.username}</p>
                                {user.motto && (
                                  <p className="text-xs text-gray-500 truncate">{user.motto}</p>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    
                    {/* Click outside to close dropdown */}
                    {showRecipientDropdown && (
                      <div 
                        className="fixed inset-0 z-0" 
                        onClick={() => setShowRecipientDropdown(false)}
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
                    <Input
                      placeholder="Message subject..."
                      value={subjectText}
                      onChange={(e) => setSubjectText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
                    <Textarea
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="min-h-[150px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!selectedUser || !messageText.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" onClick={handleCloseCompose}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : selectedUser ? (
              // View Conversation
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const conv = conversations.find(c => c.userId === selectedUser);
                        const user = getUserByUsername(selectedUsername);
                        return (
                          <>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user?.avatar || conv?.avatar} />
                              <AvatarFallback>{selectedUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">{selectedUsername}</CardTitle>
                              <Link 
                                to={`/profile/${selectedUsername}`} 
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View Profile
                              </Link>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[350px] p-4">
                    <div className="space-y-4">
                      {selectedMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-4 rounded-lg ${
                              msg.senderId === currentUser.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="font-medium text-sm mb-1">{msg.subject}</p>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <div className={`text-xs mt-2 flex items-center gap-1 ${
                              msg.senderId === currentUser.id ? 'text-blue-200' : 'text-gray-500'
                            }`}>
                              {formatDate(msg.createdAt)}
                              {msg.senderId === currentUser.id && (
                                msg.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              // No selection
              <div className="h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">or start a new message</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
