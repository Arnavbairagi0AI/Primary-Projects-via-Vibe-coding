/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  MessageSquare, 
  ShoppingBag, 
  IndianRupee, 
  Users, 
  Bot, 
  ArrowUpRight 
} from 'lucide-react';

interface StatsProps {
  totalConversations: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  aiUsageCount: number;
}

export default function DashboardStats({
  totalConversations,
  totalOrders,
  totalRevenue,
  totalCustomers,
  aiUsageCount,
}: StatsProps) {
  
  const stats = [
    {
      id: 'conversations',
      label: 'WhatsApp Conversations',
      value: totalConversations,
      subtext: 'Active Chat sessions',
      icon: MessageSquare,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'orders',
      label: 'Total Orders Placed',
      value: totalOrders,
      subtext: 'Across all channels',
      icon: ShoppingBag,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'revenue',
      label: 'Platform Revenue',
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      subtext: 'Orders + Subscriptions',
      icon: IndianRupee,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'customers',
      label: 'Unique Customers',
      value: totalCustomers,
      subtext: 'Verified WhatsApp contacts',
      icon: Users,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'ai-replies',
      label: 'AI Automation Replies',
      value: aiUsageCount,
      subtext: '94% automated responses',
      icon: Bot,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.id}
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</span>
              <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-white tracking-tight font-display">{stat.value}</span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +12%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
