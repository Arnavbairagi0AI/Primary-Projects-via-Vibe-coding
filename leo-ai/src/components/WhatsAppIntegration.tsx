/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  addDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Conversation, ChatMessage, WhatsAppConfig } from '../types';
import { 
  MessageSquare, 
  Bot, 
  User, 
  ShieldAlert, 
  Copy, 
  Check, 
  Send, 
  Zap, 
  Terminal, 
  Radio,
  ChevronLeft,
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface WhatsAppProps {
  businessId: string;
  businessName: string;
  onNewMessageSimulated: () => void;
}

export default function WhatsAppIntegration({ businessId, businessName, onNewMessageSimulated }: WhatsAppProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [success, setSuccess] = useState('');
  const [mobileActivePane, setMobileActivePane] = useState<'list' | 'chat'>('list');
  
  // Credentials Form
  const [phoneId, setPhoneId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [copied, setCopied] = useState(false);

  // Manual response text
  const [manualReply, setManualReply] = useState('');

  // Simulator Panel states
  const [simPhone, setSimPhone] = useState('+91 98765 43210');
  const [simName, setSimName] = useState('Aarav Sharma');
  const [simText, setSimText] = useState('I want to order Premium Butter Paneer Combo and Mango Lassi.');
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    // 1. Fetch credentials
    const fetchConfig = async () => {
      const docRef = doc(db, 'businesses', businessId, 'settings', 'whatsapp');
      const docSnap = await getDocs(collection(db, 'businesses', businessId, 'settings'));
      const found = docSnap.docs.find(d => d.id === 'whatsapp');
      if (found) {
        const data = found.data() as WhatsAppConfig;
        setConfig(data);
        setPhoneId(data.phoneNumberId || '');
        setAccessToken(data.accessToken || '');
      }
    };
    fetchConfig();

    // 2. Setup real-time listener for active Conversations
    const conversationsRef = collection(db, 'businesses', businessId, 'conversations');
    const unsubscribe = onSnapshot(conversationsRef, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      const sorted = list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      setConversations(sorted);

      // Preserve active conversation reference
      if (selectedConvo) {
        const updated = sorted.find(c => c.id === selectedConvo.id);
        if (updated) setSelectedConvo(updated);
      } else if (sorted.length > 0) {
        setSelectedConvo(sorted[0]);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setSuccess('');

    try {
      const docRef = doc(db, 'businesses', businessId, 'settings', 'whatsapp');
      await setDoc(docRef, {
        phoneNumberId: phoneId,
        accessToken,
        verifyToken: 'leo_ai_secure_token_2026',
        webhookUrl: `https://api.leoai.saas/api/whatsapp/webhook/${businessId}`,
        status: 'connected',
      });
      setSuccess('WhatsApp API Credentials updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCopyWebhook = () => {
    const url = `https://api.leoai.saas/api/whatsapp/webhook/${businessId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleTakeover = async (convo: Conversation) => {
    try {
      const nextMode = convo.takeoverMode === 'ai' ? 'human' : 'ai';
      const ref = doc(db, 'businesses', businessId, 'conversations', convo.id);
      await updateDoc(ref, { takeoverMode: nextMode });
    } catch (err) {
      console.error(err);
    }
  };

  // Manual business representative reply inside live-chat
  const handleSendManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvo || !manualReply.trim()) return;

    const replyText = manualReply.trim();
    setManualReply('');

    try {
      const convoRef = doc(db, 'businesses', businessId, 'conversations', selectedConvo.id);
      const newMsg: ChatMessage = {
        id: `msg_manual_${Date.now()}`,
        sender: 'human',
        text: replyText,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(convoRef, {
        messages: [...selectedConvo.messages, newMsg],
        lastMessage: replyText,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Incoming Message Simulator
  const handleTriggerSimulateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simPhone || !simText) return;

    setSimulating(true);
    try {
      // 1. Fetch AI rules to generate response if AI takeover mode is 'ai'
      let responseText = '';
      const docRef = doc(db, 'businesses', businessId, 'settings', 'ai');
      const aiSnap = await getDoc(docRef);
      const aiSettings = aiSnap.exists() ? aiSnap.data() : {};

      // Check takeover status of the current phone
      const convoId = simPhone.replace(/\s+/g, '');
      const existingConvo = conversations.find(c => c.id === convoId);
      const takeoverMode = existingConvo ? existingConvo.takeoverMode : 'ai';

      if (takeoverMode === 'ai') {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...aiSettings,
            userInput: simText,
            messageHistory: existingConvo ? existingConvo.messages.slice(-6) : [],
          }),
        });
        const data = await response.json();
        responseText = data.reply || 'Thanks for contacting us! We received your message.';
      }

      // 2. Log in Firestore
      const newCustomerMsg: ChatMessage = {
        id: `sim_c_${Date.now()}`,
        sender: 'customer',
        text: simText,
        timestamp: new Date().toISOString(),
      };

      const messagesList = existingConvo 
        ? [...existingConvo.messages, newCustomerMsg] 
        : [newCustomerMsg];

      if (responseText && takeoverMode === 'ai') {
        const newAIMsg: ChatMessage = {
          id: `sim_ai_${Date.now() + 1}`,
          sender: 'ai',
          text: responseText,
          timestamp: new Date(Date.now() + 1000).toISOString(),
        };
        messagesList.push(newAIMsg);
      }

      const activeConvoRef = doc(db, 'businesses', businessId, 'conversations', convoId);
      await setDoc(activeConvoRef, {
        id: convoId,
        customerPhone: simPhone,
        customerName: simName || simPhone,
        lastMessage: responseText && takeoverMode === 'ai' ? responseText : simText,
        lastMessageAt: new Date().toISOString(),
        unreadCount: takeoverMode === 'human' ? 1 : 0,
        takeoverMode: takeoverMode,
        messages: messagesList,
      });

      // 3. Register or increment Customer details in Firestore
      const customersRef = collection(db, 'businesses', businessId, 'customers');
      const custSnap = await getDocs(customersRef);
      const cleanPhone = simPhone.trim();
      const existingCust = custSnap.docs.find(d => d.data().phone === cleanPhone);

      if (existingCust) {
        const docRef = doc(db, 'businesses', businessId, 'customers', existingCust.id);
        await updateDoc(docRef, {
          orderCount: existingCust.data().orderCount + (simText.toLowerCase().includes('order') ? 1 : 0),
          totalSpent: existingCust.data().totalSpent + (simText.toLowerCase().includes('order') ? 350 : 0),
        });
      } else {
        await addDoc(customersRef, {
          name: simName || 'WhatsApp Guest',
          phone: cleanPhone,
          orderCount: simText.toLowerCase().includes('order') ? 1 : 0,
          totalSpent: simText.toLowerCase().includes('order') ? 350 : 0,
          createdAt: new Date().toISOString(),
          isRepeat: false,
          notes: 'Added via simulated live WhatsApp message',
        });
      }

      // 4. Create a simulated Order if keyword is order
      if (simText.toLowerCase().includes('order') || simText.toLowerCase().includes('paneer') || simText.toLowerCase().includes('lassi')) {
        const orderRef = doc(db, 'businesses', businessId, 'orders', `ORD-${Math.floor(1000 + Math.random() * 9000)}`);
        await setDoc(orderRef, {
          id: orderRef.id,
          customerName: simName || 'WhatsApp Guest',
          customerPhone: simPhone,
          items: [
            { productId: 'prod1', name: 'Premium Butter Paneer Combo', quantity: 1, price: 280 },
            { productId: 'prod5', name: 'Mango Lassi', quantity: 1, price: 90 },
          ],
          total: 370,
          status: 'new',
          notes: 'Requested via WhatsApp Assistant',
          createdAt: new Date().toISOString(),
          timeline: [
            { status: 'new', timestamp: new Date().toISOString(), note: 'Simulated Order received from WhatsApp Assistant' }
          ]
        });
      }

      setSimText('');
      onNewMessageSimulated();
    } catch (err) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="whatsapp-integration-panel">
      
      {/* Credentials and Webhook Config Column */}
      <div className="xl:col-span-4 space-y-6">
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
          <h2 className="text-md font-bold text-white tracking-tight font-display flex items-center gap-2 mb-1">
            <Radio className="w-5 h-5 text-emerald-400" />
            WhatsApp Cloud API
          </h2>
          <p className="text-xs text-gray-400 mb-4">Connect your Meta Business portal credentials</p>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number ID</label>
              <input
                type="text"
                required
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
                placeholder="e.g. 1092837482910"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Permanent Access Token</label>
              <input
                type="password"
                required
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAGy..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-emerald-500"
              />
            </div>

            {success && (
              <p className="text-emerald-400 text-xs bg-emerald-500/10 p-2.5 rounded border border-emerald-500/20">{success}</p>
            )}

            <button
              type="submit"
              disabled={savingConfig}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs py-2 rounded-xl cursor-pointer transition disabled:opacity-55"
            >
              {savingConfig ? 'Connecting credentials...' : 'Save WhatsApp Configuration'}
            </button>
          </form>

          {/* Webhook Configuration Guide */}
          <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Meta Webhook Configuration</h3>
            <div>
              <p className="text-[10px] text-gray-400">Callback URL:</p>
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  readOnly
                  value={`https://api.leoai.saas/api/whatsapp/webhook/${businessId}`}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-gray-300 flex-1 outline-none"
                />
                <button
                  onClick={handleCopyWebhook}
                  className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Verify Token:</p>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-1">leo_ai_secure_token_2026</p>
            </div>
          </div>
        </div>

        {/* Permanent Access Token Guide box */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-1 font-display">
            <Zap className="w-4 h-4 text-emerald-400" />
            Permanent Access Token Guide
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            A standard temporary Meta Developer token expires in 24 hours. A <strong>Permanent Access Token</strong> keeps your AI Assistant active 24/7/365 without manual renewals.
          </p>
          <div className="space-y-3.5 text-xs text-gray-300">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="font-bold text-white mb-1.5 flex items-center gap-1">👑 What the Owner Can Do:</p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-400">
                <li>Keep WhatsApp AI chat live 24/7 with zero downtime or maintenance checks.</li>
                <li>Take takeoverMode controls to manually override and send direct human responses.</li>
                <li>Verify customer phone numbers, place new orders, and sync database records dynamically.</li>
              </ul>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="font-bold text-white mb-1.5 flex items-center gap-1">🔑 How to Get a Permanent Access Token:</p>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-400">
                <li>Go to the <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">Meta Developers Portal <ExternalLink className="w-3 h-3" /></a>.</li>
                <li>Navigate to your <strong>Business Manager Settings</strong>.</li>
                <li>Go to <strong>System Users</strong>, create a new System User, and select <strong>Admin</strong> role.</li>
                <li>Click <strong>Generate New Token</strong>, select your WhatsApp App, and check <strong>whatsapp_business_messaging</strong> and <strong>whatsapp_business_management</strong> scopes.</li>
                <li>Copy the generated permanent token and paste it in the field above!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Incoming Message Simulator Panel */}
        <div className="bg-emerald-950/10 border border-emerald-500/20 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2 font-display">
            <Terminal className="w-4.5 h-4.5" />
            Meta Message Simulator
          </h3>
          <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
            Simulate receiving an actual customer message from Meta on WhatsApp to test order parsing and AI replies.
          </p>

          <form onSubmit={handleTriggerSimulateMessage} className="space-y-3.5">
            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase">Customer Name</label>
              <input
                type="text"
                required
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-white text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase">WhatsApp Number</label>
              <input
                type="text"
                required
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-white text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-gray-400 uppercase">Message Text</label>
              <textarea
                rows={3}
                required
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Type simulated customer queries or orders here"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-white text-xs outline-none resize-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs py-2 rounded-xl transition cursor-pointer disabled:opacity-55"
            >
              {simulating ? 'Injecting webhook...' : 'Simulate Incoming Webhook'}
            </button>
          </form>
        </div>
      </div>

      {/* WhatsApp Conversations & Live Chat Viewer Column */}
      <div className="xl:col-span-8 flex bg-[#0c1317] border border-[#222d32] rounded-2xl overflow-hidden shadow-2xl h-[600px] sm:h-[650px]" id="whatsapp-live-chat-viewer">
        {/* Left: Active Chats List */}
        <div className={`
          w-full md:w-80 border-r border-[#2a3942] flex flex-col bg-[#111b21] shrink-0
          ${mobileActivePane === 'chat' && selectedConvo ? 'hidden md:flex' : 'flex'}
        `}>
          <div className="p-4 bg-[#202c33] border-b border-[#2a3942]">
            <h3 className="text-sm font-bold text-white font-display">Inbox Chats</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#2a3942]/40 custom-scrollbar">
            {conversations.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-10">No active customer conversations.</p>
            ) : (
              conversations.map((convo) => {
                const isActive = selectedConvo?.id === convo.id;
                return (
                  <button
                    key={convo.id}
                    onClick={() => {
                      setSelectedConvo(convo);
                      setMobileActivePane('chat');
                    }}
                    className={`
                      w-full p-4 flex items-start gap-3 transition text-left cursor-pointer
                      ${isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]/50'}
                    `}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                      {convo.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="text-xs font-bold text-white truncate">{convo.customerName}</p>
                        <span className="text-[9px] text-[#8696a0]">Active</span>
                      </div>
                      <p className="text-xs text-[#8696a0] truncate">{convo.lastMessage}</p>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                        {convo.takeoverMode === 'ai' ? (
                          <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[8px] font-extrabold uppercase flex items-center gap-0.5 border border-emerald-500/20">
                            <Bot className="w-2.5 h-2.5" /> AI Managed
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[8px] font-extrabold uppercase flex items-center gap-0.5 border border-amber-500/20">
                            <User className="w-2.5 h-2.5" /> Human Managed
                          </span>
                        )}

                        {convo.unreadCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-auto" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Active Conversation Chat Bubbles Window */}
        <div className={`
          flex-1 flex flex-col bg-[#0b141a] min-w-0
          ${mobileActivePane === 'list' && selectedConvo ? 'hidden md:flex' : 'flex'}
        `}>
          {selectedConvo ? (
            <>
              {/* Live Chat Window Header */}
              <div className="bg-[#202c33] px-3 py-2.5 sm:px-5 sm:py-3 border-b border-[#2a3942] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Back to Inbox button for mobile */}
                  <button
                    onClick={() => setMobileActivePane('list')}
                    className="md:hidden p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
                    title="Back to Inbox"
                  >
                    <ChevronLeft className="w-5 h-5 text-emerald-400" />
                  </button>

                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-xs shrink-0">
                    {selectedConvo.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white font-display truncate max-w-[100px] sm:max-w-[200px]">{selectedConvo.customerName}</h4>
                    <p className="text-[9px] sm:text-[10px] text-[#8696a0] font-medium mt-0.5 truncate">{selectedConvo.customerPhone}</p>
                  </div>
                </div>

                {/* Takeover Control Toggle Button */}
                <button
                  onClick={() => handleToggleTakeover(selectedConvo)}
                  className={`
                    px-2.5 py-1.5 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold border transition flex items-center gap-1 cursor-pointer shrink-0
                    ${selectedConvo.takeoverMode === 'ai'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    }
                  `}
                >
                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">{selectedConvo.takeoverMode === 'ai' ? 'Pause AI (Takeover)' : 'Resume AI Agent'}</span>
                  <span className="sm:hidden">{selectedConvo.takeoverMode === 'ai' ? 'Pause AI' : 'Resume AI'}</span>
                </button>
              </div>

              {/* Chat bubbles viewport */}
              <div 
                className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 custom-scrollbar"
                style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundBlendMode: "overlay", backgroundColor: "#0b141a" }}
              >
                {selectedConvo.messages?.map((msg, i) => {
                  const isIncoming = msg.sender === 'customer';
                  return (
                    <div 
                      key={msg.id || i}
                      className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-3 py-2 text-xs relative flex flex-col ${
                        isIncoming 
                          ? 'bg-[#202c33] text-white self-start border border-[#2a3942]' 
                          : msg.sender === 'ai'
                          ? 'bg-[#128c7e] text-white self-end'
                          : 'bg-emerald-500 text-black font-semibold self-end'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                      <div className="flex items-center gap-1 justify-end mt-1 text-[8px] text-gray-400">
                        <span>{msg.sender === 'ai' ? '🤖 Leo' : msg.sender === 'human' ? '👤 Staff' : 'User'}</span>
                        <span>•</span>
                        <span>Just now</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manual Live Send Message input */}
              <form onSubmit={handleSendManualReply} className="bg-[#202c33] px-3 py-2.5 sm:px-4 sm:py-3 border-t border-[#2a3942] flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  placeholder={selectedConvo.takeoverMode === 'ai' ? "Turn off 'AI Managed' to reply..." : "Type manual response..."}
                  disabled={selectedConvo.takeoverMode === 'ai'}
                  value={manualReply}
                  onChange={(e) => setManualReply(e.target.value)}
                  className="flex-1 bg-[#2a3942] border border-transparent rounded-xl py-2 px-3 sm:px-4 text-white text-xs outline-none focus:border-[#00a884] disabled:opacity-40 min-w-0"
                />
                <button
                  type="submit"
                  disabled={!manualReply.trim() || selectedConvo.takeoverMode === 'ai'}
                  className="p-2 sm:p-2.5 bg-[#00a884] hover:bg-[#00c298] text-white rounded-full transition cursor-pointer disabled:opacity-40 shrink-0"
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-700 mb-3" />
              <p className="text-gray-400 font-bold text-sm">Select a Conversation</p>
              <p className="text-gray-500 text-xs mt-1">Select an active contact or use the Simulator to inject messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
