/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, TimelineEvent } from '../types';
import { 
  ShoppingBag, 
  CheckCircle2, 
  Truck, 
  Clock, 
  XCircle, 
  Calendar, 
  User, 
  MapPin, 
  Clock8,
  Eye,
  Check,
  X,
  Search,
  ArrowUpDown,
  Download
} from 'lucide-react';

interface OrdersProps {
  businessId: string;
  selectedOrderId?: string | null;
  onClearSelectedOrderId?: () => void;
}

export default function OrderManagement({ businessId, selectedOrderId, onClearSelectedOrderId }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'preparing' | 'delivered' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'>('date-desc');

  useEffect(() => {
    const ordersRef = collection(db, 'businesses', businessId, 'orders');
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Sort newest orders first
      const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(sorted);
      
      // Preserve active selection reference
      if (selectedOrder) {
        const updated = sorted.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [businessId]);

  // Handle selectedOrderId from parent (Global Search)
  useEffect(() => {
    if (selectedOrderId && orders.length > 0) {
      const found = orders.find(o => o.id === selectedOrderId);
      if (found) {
        setSelectedOrder(found);
        setActiveFilter('all'); // Ensure it is visible in the list
        if (onClearSelectedOrderId) {
          onClearSelectedOrderId();
        }
      }
    }
  }, [selectedOrderId, orders, onClearSelectedOrderId]);

  const handleUpdateStatus = async (orderId: string, nextStatus: Order['status']) => {
    try {
      const ref = doc(db, 'businesses', businessId, 'orders', orderId);
      const timelineEvent: TimelineEvent = {
        status: nextStatus,
        timestamp: new Date().toISOString(),
        note: `Order marked as ${nextStatus} by staff`,
      };

      // Fetch current order to append timeline
      const current = orders.find(o => o.id === orderId);
      const updatedTimeline = current ? [...current.timeline, timelineEvent] : [timelineEvent];

      await updateDoc(ref, {
        status: nextStatus,
        timeline: updatedTimeline,
      });
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const filteredAndSortedOrders = orders
    .filter((o) => {
      // 1. Status Filter
      if (activeFilter !== 'all' && o.status !== activeFilter) return false;
      
      // 2. Search Filter
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const nameMatch = o.customerName?.toLowerCase().includes(term);
        const phoneMatch = o.customerPhone?.includes(term);
        const idMatch = o.id?.toLowerCase().includes(term);
        return nameMatch || phoneMatch || idMatch;
      }
      return true;
    })
    .sort((a, b) => {
      // 3. Sort
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'total-desc') {
        return b.total - a.total;
      } else if (sortBy === 'total-asc') {
        return a.total - b.total;
      }
      return 0;
    });

  const handleExportCSV = () => {
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Total Amount (INR)',
      'Status',
      'Address',
      'Items Count',
      'Items Detail'
    ];

    const rows = filteredAndSortedOrders.map(order => {
      const itemsDetail = order.items?.map(item => `${item.name} (x${item.quantity}) - ₹${item.price * item.quantity}`).join('; ') || '';
      return [
        `"${order.id}"`,
        `"${new Date(order.createdAt).toLocaleString('en-IN')}"`,
        `"${(order.customerName || '').replace(/"/g, '""')}"`,
        `"${order.customerPhone}"`,
        order.total,
        `"${order.status.toUpperCase()}"`,
        `"${(order.address || '').replace(/"/g, '""')}"`,
        order.items?.length || 0,
        `"${itemsDetail.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'pending': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'confirmed': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
      case 'preparing': return 'bg-violet-500/10 border-violet-500/20 text-violet-400';
      case 'delivered': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'cancelled': return 'bg-red-500/10 border-red-500/20 text-red-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="orders-management-panel">
      {/* Left Column: Orders list filter and table */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Search, Sort & Export Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl">
          {/* Direct Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search orders by customer or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-9 text-white text-xs outline-none focus:border-emerald-500/50 focus:bg-white/10 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-2.5 p-1 text-gray-400 hover:text-white rounded-lg transition"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full sm:w-auto appearance-none bg-[#0a0a0a] border border-white/10 rounded-xl py-2 pl-3 pr-9 text-xs text-white outline-none focus:border-emerald-500/50 hover:bg-white/10 transition cursor-pointer"
              >
                <option value="date-desc">Date: Newest First</option>
                <option value="date-asc">Date: Oldest First</option>
                <option value="total-desc">Total: Highest First</option>
                <option value="total-asc">Total: Lowest First</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold cursor-pointer transition flex-1 sm:flex-initial shrink-0"
              title="Export Orders to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Panel bar */}
        <div className="flex flex-wrap gap-2 bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl">
          {['all', 'new', 'preparing', 'delivered', 'cancelled'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as any)}
              className={`
                px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer border transition
                ${activeFilter === filter 
                  ? 'bg-emerald-500 border-emerald-400 text-black font-bold' 
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {filter}
              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-black/30 font-bold text-[10px]">
                {filter === 'all' ? orders.length : orders.filter(o => o.status === filter).length}
              </span>
            </button>
          ))}
        </div>

        {/* Orders list container */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          {filteredAndSortedOrders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-semibold">No orders found</p>
              <p className="text-gray-500 text-xs mt-1">Try adjusting your filters, search term, or select another status bucket.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Customer Details</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAndSortedOrders.map((order) => (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-white/5 transition duration-150 cursor-pointer ${selectedOrder?.id === order.id ? 'bg-white/10' : ''}`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="py-4 px-6 font-mono text-xs font-extrabold text-emerald-400">{order.id}</td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="text-xs font-bold text-white">{order.customerName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{order.customerPhone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-display font-bold text-xs text-white">₹{order.total}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick confirmation button */}
                          {order.status === 'new' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                              className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20 rounded-lg transition"
                              title="Accept Order"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 rounded-lg transition flex items-center gap-1 text-[10px] font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Expanded Order Detail & Timeline */}
      <div className={`
        ${selectedOrder ? 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:block lg:col-span-4' : 'hidden lg:block lg:col-span-4'}
      `}>
        {selectedOrder ? (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col w-full max-w-lg lg:max-w-none h-auto max-h-[90vh] lg:h-full lg:max-h-none sticky lg:top-6 animate-scale-up">
            {/* Header Details */}
            <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono font-extrabold text-emerald-400">{selectedOrder.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </h3>
              </div>
              
              {/* Close button for mobile details view */}
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition ml-4 cursor-pointer"
                title="Close Details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[500px]">
              {/* Customer Segment */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Profile</h4>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500" /> {selectedOrder.customerName}
                  </p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" /> Sector 62, Noida, UP
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ordered Items</h4>
                <div className="divide-y divide-white/5 bg-white/5 rounded-xl border border-white/5 px-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="py-2.5 flex justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-gray-500 mt-0.5">{item.quantity} x ₹{item.price}</p>
                      </div>
                      <span className="font-bold text-white font-display">₹{item.quantity * item.price}</span>
                    </div>
                  ))}
                  <div className="py-3 flex justify-between font-bold text-xs text-white border-t border-white/5">
                    <span>Total Amount</span>
                    <span className="font-display text-sm text-emerald-400">₹{selectedOrder.total}</span>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer Notes</h4>
                  <p className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl italic leading-relaxed">
                    "{selectedOrder.notes}"
                  </p>
                </div>
              )}

              {/* Order Status Controller Dropdown/Buttons */}
              <div className="space-y-2 pt-3 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update Order Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['confirmed', 'preparing', 'delivered', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedOrder.id, st as any)}
                      className={`
                        py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition text-center
                        ${selectedOrder.status === st 
                          ? 'bg-emerald-500 border-emerald-400 text-black font-bold' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }
                      `}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order History Timeline */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Progress Timeline</h4>
                <div className="relative border-l border-white/5 ml-2 pl-4 space-y-4">
                  {selectedOrder.timeline?.map((evt, i) => (
                    <div key={i} className="relative">
                      {/* Timeline dot marker */}
                      <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#0a0a0a]" />
                      <div>
                        <p className="text-xs font-bold text-white capitalize">{evt.status}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock8 className="w-3.5 h-3.5 text-gray-500" />
                          {new Date(evt.timestamp).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                        </p>
                        {evt.note && <p className="text-[10px] text-gray-500 mt-1 italic">{evt.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl text-center flex flex-col items-center justify-center h-full min-h-[400px]">
            <ShoppingBag className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-gray-400 font-bold text-xs">Select an Order</p>
            <p className="text-gray-500 text-[10px] mt-1">Select any order row on the left to review details and status history timeline</p>
          </div>
        )}
      </div>
    </div>
  );
}
