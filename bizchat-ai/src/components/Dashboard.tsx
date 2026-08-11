import React from 'react';
import { 
  MessageSquare, 
  Bot, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Customer, Order, Conversation } from '../types';

interface DashboardProps {
  customers: Customer[];
  orders: Order[];
  conversations: Conversation[];
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({ customers, orders, conversations, onNavigateToTab }: DashboardProps) {
  // Aggregate Metrics
  const totalConversations = conversations.length;
  const totalAIReplies = conversations.reduce((acc, c) => 
    acc + c.messages.filter(m => m.sender === 'ai').length, 0);
  const totalCustomers = customers.length;
  const totalOrders = orders.length;
  
  // Calculate revenue from Delivered or Preparing orders
  const monthlyRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  // Recharts Data - Daily Chats (Simulated last 7 days)
  const chatData = [
    { day: 'Mon', 'Customer Chats': 14, 'AI Replies': 32 },
    { day: 'Tue', 'Customer Chats': 18, 'AI Replies': 45 },
    { day: 'Wed', 'Customer Chats': 25, 'AI Replies': 56 },
    { day: 'Thu', 'Customer Chats': 20, 'AI Replies': 48 },
    { day: 'Fri', 'Customer Chats': 28, 'AI Replies': 64 },
    { day: 'Sat', 'Customer Chats': 35, 'AI Replies': 82 },
    { day: 'Sun', 'Customer Chats': 30, 'AI Replies': 71 },
  ];

  // Recharts Data - Weekly Orders (Simulated last 4 weeks)
  const orderData = [
    { name: 'Week 1', Orders: 5, Revenue: 210 },
    { name: 'Week 2', Orders: 8, Revenue: 440 },
    { name: 'Week 3', Orders: 12, Revenue: 680 },
    { name: 'Week 4', Orders: totalOrders, Revenue: monthlyRevenue },
  ];

  const cards = [
    {
      title: "Total Conversations",
      value: totalConversations,
      icon: <MessageSquare className="w-5 h-5 text-indigo-500" />,
      change: "+12.5%",
      isPositive: true,
      color: "from-indigo-500/10 to-indigo-500/5",
      textColor: "text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "AI Auto-Replies",
      value: totalAIReplies,
      icon: <Bot className="w-5 h-5 text-emerald-500" />,
      change: "+24.8%",
      isPositive: true,
      color: "from-emerald-500/10 to-emerald-500/5",
      textColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Total Customers",
      value: totalCustomers,
      icon: <Users className="w-5 h-5 text-amber-500" />,
      change: "+8.2%",
      isPositive: true,
      color: "from-amber-500/10 to-amber-500/5",
      textColor: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "Active Orders",
      value: orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length,
      icon: <ShoppingBag className="w-5 h-5 text-pink-500" />,
      change: "-5%",
      isPositive: false,
      color: "from-pink-500/10 to-pink-500/5",
      textColor: "text-pink-600 dark:text-pink-400"
    },
    {
      title: "Monthly Revenue",
      value: `$${monthlyRevenue.toFixed(2)}`,
      icon: <DollarSign className="w-5 h-5 text-teal-500" />,
      change: "+18.9%",
      isPositive: true,
      color: "from-teal-500/10 to-teal-500/5",
      textColor: "text-teal-600 dark:text-teal-400"
    }
  ];

  // Derive recent activities from Orders, Customers, Conversations
  const recentActivities = [
    ...orders.slice(0, 2).map(o => ({
      type: 'order',
      title: `New Order #${o.id}`,
      subtitle: `${o.customerName} ordered items totaling $${o.totalAmount.toFixed(2)}`,
      time: 'Just now',
      badge: o.status,
      badgeColor: o.status === 'New' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
    })),
    ...conversations.slice(0, 2).map(c => ({
      type: 'chat',
      title: `Conversation with ${c.customerName}`,
      subtitle: `AI resolved message: "${c.lastMessage}"`,
      time: '15 mins ago',
      badge: 'Resolved',
      badgeColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
    })),
    ...customers.slice(0, 1).map(cust => ({
      type: 'customer',
      title: `New Customer Registered`,
      subtitle: `${cust.name} added with tags: ${cust.tags.join(', ')}`,
      time: '1 hour ago',
      badge: 'Leads',
      badgeColor: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400'
    }))
  ];

  return (
    <div id="dashboard-view" className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Real-time business performance analytics and AI metrics.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg px-3 py-2 shadow-sm text-slate-600 dark:text-slate-300 text-xs font-medium w-fit">
          <Calendar className="w-3.5 h-3.5 text-indigo-550" />
          <span>Last 30 Days</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <div 
            key={idx} 
            className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800/80 rounded-xl p-5 shadow-sm transition-all relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider">{card.title}</p>
              <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                {card.icon}
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mt-2">{card.value}</h3>
            
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`text-[11px] font-medium flex items-center gap-0.5 ${
                card.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {card.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.change}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chats Area Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-base text-slate-850 dark:text-white">Daily Conversations</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Customer requests resolved by AI vs manual agents.</p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Volume Up
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chatData}>
                <defs>
                  <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', background: '#fff', border: '1px solid #f1f5f9' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="Customer Chats" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorChats)" />
                <Area type="monotone" dataKey="AI Replies" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorReplies)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Orders Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-base text-slate-850 dark:text-white">Order Analytics</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Weekly checkout volume and cumulative revenue.</p>
            </div>
            <button 
              onClick={() => onNavigateToTab('orders')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage Orders
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', background: '#fff', border: '1px solid #f1f5f9' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="Orders" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar yAxisId="right" dataKey="Revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity and Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Stream */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="font-semibold text-base text-slate-850 dark:text-white">Recent Shop Activity</h3>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Live Feed</span>
          </div>
          <div className="space-y-3">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="flex items-start justify-between gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                    {act.type === 'order' && <ShoppingBag className="w-4.5 h-4.5 text-indigo-500" />}
                    {act.type === 'chat' && <Bot className="w-4.5 h-4.5 text-emerald-500" />}
                    {act.type === 'customer' && <Users className="w-4.5 h-4.5 text-pink-500" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-slate-850 dark:text-slate-100">{act.title}</h4>
                    <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-0.5 truncate">{act.subtitle}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded ${act.badgeColor}`}>
                    {act.badge}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prepared Channels Integration Hub */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-base text-slate-850 dark:text-white mb-1.5">Prepared Integrations</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-6">
              BizChat AI includes modular controllers to plug directly into live customer touchpoints.
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌐</span>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-850 dark:text-slate-200">Web Chat Widget</h4>
                    <p className="text-[9px] text-emerald-600 font-semibold uppercase mt-0.5">● Connected</p>
                  </div>
                </div>
                <button 
                  onClick={() => onNavigateToTab('chat')}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Test
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                  <span className="text-lg">💬</span>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-850 dark:text-slate-200">WhatsApp API</h4>
                    <p className="text-[9px] text-emerald-600 font-semibold uppercase mt-0.5">Ready to connect</p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded">Free</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📱</span>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-850 dark:text-slate-200">SMS Bot</h4>
                    <p className="text-[9px] text-emerald-600 font-semibold uppercase mt-0.5">Ready to connect</p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded">Free</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onNavigateToTab('settings')}
            className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-lg border border-slate-200/60 dark:border-slate-800 transition-colors"
          >
            Configure Settings
          </button>
        </div>
      </div>
    </div>
  );
}
