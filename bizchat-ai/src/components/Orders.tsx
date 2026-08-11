import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Clock, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Sparkles,
  RefreshCw,
  TrendingUp,
  X,
  Phone,
  Coins
} from 'lucide-react';
import { Order, OrderStatus, Product } from '../types';

interface OrdersProps {
  orders: Order[];
  products: Product[];
  onUpdateOrders: (updated: Order[]) => void;
  onAddNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function Orders({ orders, products, onUpdateOrders, onAddNotification }: OrdersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'All'>('All');
  
  // Create manual order state
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [prodQty, setProdQty] = useState(1);
  const [orderItems, setOrderItems] = useState<{ productId: string; productName: string; quantity: number; price: number }[]>([]);

  const statuses: OrderStatus[] = ['New', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'New': 
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'Preparing': 
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'Ready': 
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
      case 'Delivered': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'Cancelled': 
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
    }
  };

  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    const updated = orders.map(o => {
      if (o.id === id) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    onUpdateOrders(updated);
    onAddNotification('Order Updated', `Order #${id} status changed to "${newStatus}".`, 'success');
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All' || o.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleAddItem = () => {
    if (!selectedProdId) return;
    const prod = products.find(p => p.id === selectedProdId);
    if (!prod) return;

    // Check if item already added
    const exist = orderItems.find(item => item.productId === selectedProdId);
    if (exist) {
      setOrderItems(orderItems.map(item => 
        item.productId === selectedProdId 
          ? { ...item, quantity: item.quantity + prodQty } 
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        productId: prod.id,
        productName: prod.name,
        quantity: prodQty,
        price: prod.price
      }]);
    }
    
    setSelectedProdId('');
    setProdQty(1);
  };

  const handleRemoveItem = (prodId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== prodId));
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('Please add at least one product to the order.');
      return;
    }

    const newOrder: Order = {
      id: `ord_${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      customerPhone,
      items: orderItems,
      totalAmount: orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      status: 'New',
      createdAt: Date.now()
    };

    onUpdateOrders([newOrder, ...orders]);
    onAddNotification('Order Created', `Order #${newOrder.id} registered successfully for ${customerName}.`, 'success');
    
    // Reset state
    setCustomerName('');
    setCustomerPhone('');
    setOrderItems([]);
    setShowModal(false);
  };

  return (
    <div id="orders-view" className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Orders</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fulfill customer purchases, track status, and view transaction values.</p>
        </div>
        <button
          id="create-order-btn"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-755 transition-all text-xs w-fit cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Order Slip
        </button>
      </div>

      {/* Filter Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statuses.map(st => {
          const count = orders.filter(o => o.status === st).length;
          const totalValue = orders.filter(o => o.status === st).reduce((sum, o) => sum + o.totalAmount, 0);
          return (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                selectedStatus === st
                  ? 'bg-indigo-650 border-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-250 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <div>
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${
                  selectedStatus === st ? 'text-indigo-200' : 'text-slate-400'
                }`}>
                  {st}
                </span>
                <h4 className={`text-xl font-semibold mt-1 ${
                  selectedStatus === st ? 'text-white' : 'text-slate-800 dark:text-white'
                }`}>
                  {count}
                </h4>
              </div>
              <span className={`text-[11px] font-semibold font-mono mt-3 ${
                selectedStatus === st ? 'text-indigo-100' : 'text-slate-500'
              }`}>
                ${totalValue.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedStatus('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedStatus === 'All' 
                ? 'bg-indigo-655 text-white shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            All Pipelines
          </button>
          {statuses.map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus === st 
                  ? 'bg-indigo-655 text-white shadow-sm' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID or customer..." 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
          />
        </div>
      </div>

      {/* Orders Board / Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-12 rounded-xl text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-medium">No orders currently active in this pipeline.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => (
            <div 
              key={ord.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Card top */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                      Order #{ord.id}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block mt-1.5">
                      {new Date(ord.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <select
                      value={ord.status}
                      onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                      className={`text-xs font-semibold border rounded-lg px-2 py-1 focus:outline-none ${getStatusStyle(ord.status)} cursor-pointer`}
                    >
                      {statuses.map(st => (
                        <option key={st} value={st} className="bg-white text-slate-800">{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Customer contact info */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-4 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-lg border border-slate-100/60 dark:border-slate-850">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold mb-0.5">Purchaser</span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{ord.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-550">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px]">{ord.customerPhone}</span>
                  </div>
                </div>

                {/* Items details */}
                <div className="space-y-1.5 mb-5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-slate-650 dark:text-slate-300">
                      <div>
                        <span className="font-semibold text-slate-850 dark:text-slate-200">{item.productName}</span>
                        <span className="text-slate-400 dark:text-slate-500 ml-1.5">x{item.quantity}</span>
                      </div>
                      <span className="font-mono text-slate-450">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Total */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center">
                <div className="flex items-center gap-1 text-slate-500 text-xs">
                  <Coins className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Invoice Total</span>
                </div>
                <span className="text-base font-semibold text-slate-850 dark:text-white font-mono">
                  ${ord.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-semibold text-slate-850 dark:text-white mb-5 flex items-center gap-1.5">
              <ShoppingBag className="w-4.5 h-4.5 text-indigo-600" />
              Manual Order Slip
            </h2>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Customer Name</label>
                  <input 
                    type="text" 
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Customer Phone</label>
                  <input 
                    type="tel" 
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+1 555-0100" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              {/* Add Order Item segment */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-lg p-3.5 space-y-2.5">
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Add Items to Cart</span>
                
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedProdId}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none dark:text-white cursor-pointer"
                  >
                    <option value="">Select Product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                    ))}
                  </select>

                  <input 
                    type="number" 
                    min={1}
                    value={prodQty}
                    onChange={(e) => setProdQty(parseInt(e.target.value) || 1)}
                    className="w-14 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-indigo-650 text-white font-semibold rounded-lg text-xs hover:bg-indigo-755 shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Added items review */}
              <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
                {orderItems.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 italic py-3">No items in order slip yet.</p>
                ) : (
                  orderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-white">{item.productName}</span>
                        <span className="text-slate-400 dark:text-slate-500 ml-1.5">x{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <span className="font-mono text-slate-500">${(item.price * item.quantity).toFixed(2)}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">Total Order Amount</span>
                <span className="text-base font-semibold font-mono text-indigo-650 dark:text-indigo-400">
                  ${orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-indigo-655 hover:bg-indigo-755 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
