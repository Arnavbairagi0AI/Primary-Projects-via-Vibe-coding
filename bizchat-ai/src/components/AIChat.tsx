import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Bot, 
  User, 
  Copy, 
  RotateCw, 
  Check, 
  Sparkles, 
  Archive, 
  Inbox,
  AlertCircle,
  PlusCircle,
  ShoppingBag,
  BellRing
} from 'lucide-react';
import { Conversation, Message, Customer, Product, BusinessSettings, Order } from '../types';

interface AIChatProps {
  conversations: Conversation[];
  customers: Customer[];
  products: Product[];
  settings: BusinessSettings;
  onUpdateConversations: (updated: Conversation[]) => void;
  onAddOrder: (newOrder: Order) => void;
  onAddNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function AIChat({
  conversations,
  customers,
  products,
  settings,
  onUpdateConversations,
  onAddOrder,
  onAddNotification
}: AIChatProps) {
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [textInput, setTextInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of conversation messages
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConvId, conversations, typing]);

  const activeConversation = conversations.find(c => c.id === selectedConvId);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c => 
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Suggested quick replies for the customer simulator
  const suggestedReplies = [
    "What are your hours today?",
    "Where is your shop located?",
    "Do you have any premium coffee beans in stock?",
    "I'd like to order 2 bags of coffee beans, please!",
    "Can I buy a ceramic espresso cup?"
  ];

  // Helper to copy text to clipboard
  const handleCopy = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to extract JSON order proposal from AI message if present
  const parseOrderProposal = (text: string) => {
    const tag = '[ORDER_PROPOSAL]';
    if (!text.includes(tag)) return null;

    try {
      const parts = text.split(tag);
      const jsonStr = parts[1].trim();
      const items = JSON.parse(jsonStr);
      
      // Clean up text by removing the tag and JSON block
      const cleanText = parts[0].trim();

      return {
        cleanText,
        items: Array.isArray(items) ? items : []
      };
    } catch (e) {
      console.warn('Failed to parse order proposal JSON:', e);
      return null;
    }
  };

  // Execute Gemini or simulated assistant call
  const triggerAIChatResponse = async (userMsg: string, currentHistory: Message[]) => {
    setTyping(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: currentHistory,
          settings,
          products
        })
      });

      const data = await response.json();
      
      // Append AI response to messages
      const updatedConvs = conversations.map(c => {
        if (c.id === selectedConvId) {
          const aiMsg: Message = {
            id: `msg_ai_${Date.now()}`,
            sender: 'ai',
            text: data.text,
            timestamp: Date.now()
          };
          
          return {
            ...c,
            lastMessage: aiMsg.text.includes('[ORDER_PROPOSAL]') ? 'Proposed an order summary' : aiMsg.text,
            lastMessageTime: Date.now(),
            messages: [...c.messages, aiMsg],
            unreadCount: 0
          };
        }
        return c;
      });

      onUpdateConversations(updatedConvs);

      // Check if an order proposal is in the message to send notification
      if (data.text.includes('[ORDER_PROPOSAL]')) {
        onAddNotification(
          'AI Order Draft Created', 
          `AI draft order generated for ${activeConversation?.customerName || 'customer'}.`, 
          'success'
        );
      }
    } catch (e) {
      console.error('Error triggering AI response:', e);
    } finally {
      setTyping(false);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || textInput;
    if (!textToSend.trim()) return;

    if (!activeConversation) return;

    // Create user message
    const userMsg: Message = {
      id: `msg_cust_${Date.now()}`,
      sender: 'customer',
      text: textToSend,
      timestamp: Date.now()
    };

    const updatedConversations = conversations.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          lastMessage: userMsg.text,
          lastMessageTime: Date.now(),
          messages: [...c.messages, userMsg],
          unreadCount: 0
        };
      }
      return c;
    });

    onUpdateConversations(updatedConversations);
    if (!customText) {
      setTextInput('');
    }

    // Capture conversation snapshot for history
    const historySnapshot = [...(activeConversation?.messages || []), userMsg];

    // Trigger AI response with short delay for realism
    setTimeout(() => {
      triggerAIChatResponse(userMsg.text, historySnapshot);
    }, 1000);
  };

  const handleRegenerate = async (msgIndex: number) => {
    if (!activeConversation) return;

    // Slice messages up to the index (getting the preceding query)
    const subHistory = activeConversation.messages.slice(0, msgIndex);
    const lastUserQuery = subHistory[subHistory.length - 1];
    
    if (!lastUserQuery || lastUserQuery.sender !== 'customer') {
      return;
    }

    // Remove the AI message we are regenerating and everything after
    const updatedMessages = activeConversation.messages.slice(0, msgIndex);
    
    const updatedConvs = conversations.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          messages: updatedMessages
        };
      }
      return c;
    });
    
    onUpdateConversations(updatedConvs);
    
    // Call AI again
    triggerAIChatResponse(lastUserQuery.text, updatedMessages.slice(0, -1));
  };

  const handleApproveOrderProposal = (items: any[]) => {
    if (!activeConversation) return;

    // Find if customer already exists in DB
    const cust = customers.find(cu => cu.name === activeConversation.customerName);

    const newOrder: Order = {
      id: `ord_${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: activeConversation.customerName,
      customerPhone: cust?.phone || '+1 555-0199',
      items: items.map(item => ({
        productId: products.find(p => p.name.toLowerCase() === item.productName.toLowerCase())?.id || 'custom',
        productName: item.productName,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'New',
      createdAt: Date.now()
    };

    onAddOrder(newOrder);
    onAddNotification(
      'Order Approved',
      `Order #${newOrder.id} has been added for preparation!`,
      'success'
    );

    // Append confirmation message to chat
    const confirmMsg: Message = {
      id: `msg_agent_${Date.now()}`,
      sender: 'agent',
      text: `✅ Order confirmed! I've approved Order #${newOrder.id} totaling $${newOrder.totalAmount.toFixed(2)}. Our team is preparing it now!`,
      timestamp: Date.now()
    };

    const updatedConvs = conversations.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          lastMessage: confirmMsg.text,
          lastMessageTime: Date.now(),
          messages: [...c.messages, confirmMsg]
        };
      }
      return c;
    });
    onUpdateConversations(updatedConvs);
  };

  return (
    <div id="ai-chat-view" className="h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar Customer History */}
      <div className="border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full bg-slate-50/20 dark:bg-slate-900/40">
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800">
          <h2 className="font-semibold text-slate-800 dark:text-white text-sm">Conversations</h2>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase mt-0.5 tracking-wider">AI Automated Channels</p>
          
          <div className="relative mt-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..." 
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg pl-8.5 pr-4 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
            />
          </div>
        </div>

        {/* List of Chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No active conversations.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === selectedConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full text-left p-4 transition-all flex items-start gap-3 ${
                    isActive 
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-l-2 border-indigo-600' 
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/10'
                  }`}
                >
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${conv.customerName}`} 
                    alt={conv.customerName} 
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-slate-850 dark:text-slate-200 truncate">{conv.customerName}</span>
                      <span className="text-[9px] text-slate-450">
                        {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                    {conv.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center bg-indigo-600 text-white font-semibold text-[9px] rounded h-3.5 min-w-3.5 px-1 mt-1.5">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Conversation Room */}
      <div className="lg:col-span-3 flex flex-col h-full bg-slate-50/20 dark:bg-slate-900/10">
        {activeConversation ? (
          <>
            {/* Header info */}
            <div className="px-6 py-4 border-b border-slate-200/85 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${activeConversation.customerName}`} 
                    alt={activeConversation.customerName} 
                    className="w-9 h-9 rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{activeConversation.customerName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[9px] font-semibold text-indigo-500 uppercase tracking-wider">AI Agent Handling</span>
                  </div>
                </div>
              </div>

              {/* Suggested Simulation controls */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                  Active Channel: Web Widget
                </span>
              </div>
            </div>

            {/* Conversation Bubbles */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeConversation.messages.map((msg, index) => {
                const isUser = msg.sender === 'customer';
                const isAI = msg.sender === 'ai';
                const isAgent = msg.sender === 'agent';
                
                // Parse AI messages for embedded draft orders
                const parsedOrder = isAI ? parseOrderProposal(msg.text) : null;
                const displayText = parsedOrder ? parsedOrder.cleanText : msg.text;

                return (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                  >
                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-medium ${
                      isUser 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600' 
                        : isAI 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-emerald-500 text-white'
                    }`}>
                      {isUser ? <User className="w-3.5 h-3.5 text-slate-500" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div className="space-y-1">
                      <div className={`rounded-xl p-3.5 text-xs md:text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-100 rounded-tr-none' 
                          : isAI 
                            ? 'bg-indigo-50/50 border border-indigo-100/50 dark:bg-indigo-950/20 dark:border-indigo-900/30 text-slate-800 dark:text-slate-100 rounded-tl-none' 
                            : 'bg-emerald-50/50 border border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-slate-800 dark:text-slate-100 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-wrap">{displayText}</p>

                        {/* Order Proposal Highlight Card inside Bubble */}
                        {parsedOrder && parsedOrder.items.length > 0 && (
                          <div className="mt-3.5 border-t border-indigo-100 dark:border-indigo-900/30 pt-3 space-y-3">
                            <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
                              <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
                              <span>AI GENERATED ORDER PROPOSAL</span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30 rounded-lg p-3 space-y-2">
                              {parsedOrder.items.map((item, iIdx) => (
                                <div key={iIdx} className="flex justify-between items-center text-xs">
                                  <div>
                                    <span className="font-semibold text-slate-850 dark:text-slate-200">{item.productName}</span>
                                    <span className="text-slate-400 dark:text-slate-500 ml-1.5">x{item.quantity}</span>
                                  </div>
                                  <span className="font-mono text-slate-500">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between items-center text-xs font-semibold">
                                <span className="text-slate-500 dark:text-slate-400">Total Draft Amount</span>
                                <span className="text-slate-900 dark:text-white font-mono">
                                  ${parsedOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleApproveOrderProposal(parsedOrder.items)}
                                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-755 text-white font-medium text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                              >
                                Approve & Create Order
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer controls for message */}
                      {!isUser && (
                        <div className="flex items-center gap-2 px-1">
                          <button 
                            onClick={() => handleCopy(displayText, msg.id)}
                            className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Copy reply"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          {isAI && (
                            <button 
                              onClick={() => handleRegenerate(index)}
                              className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[10px]"
                              title="Regenerate Gemini AI Reply"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>Regenerate</span>
                            </button>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* AI is Typing loader */}
              {typing && (
                <div className="flex items-start gap-3 mr-auto max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-indigo-650 text-white shrink-0 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl rounded-tl-none p-3.5 flex items-center gap-1 border border-indigo-100/50 dark:border-indigo-900/30">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Simulated Customer Suggested Replies Tray */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 overflow-x-auto whitespace-nowrap flex gap-1.5 items-center">
              <span className="text-[9px] font-semibold text-indigo-600 shrink-0 uppercase mr-1">💬 Customer Simulator:</span>
              {suggestedReplies.map((rep, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(rep)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 transition-all shrink-0 shadow-sm"
                >
                  {rep}
                </button>
              ))}
            </div>

            {/* Typing box */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex gap-3.5 items-center">
              <input 
                type="text" 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Simulate customer typing message to Gemini assistant..." 
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/65 rounded-lg px-3.5 py-2.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
              />
              <button 
                onClick={() => handleSendMessage()}
                className="w-9 h-9 bg-indigo-650 hover:bg-indigo-755 text-white rounded-lg flex items-center justify-center shadow-sm transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-slate-50/20 dark:bg-slate-900/10">
            <Inbox className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-slate-400 text-sm">Select a customer conversation from the side to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
