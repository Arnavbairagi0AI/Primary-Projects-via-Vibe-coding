import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Tag, 
  Phone, 
  Mail, 
  MessageSquare, 
  Notebook, 
  X, 
  Check, 
  Edit3, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Customer } from '../types';

interface CustomersProps {
  customers: Customer[];
  onUpdateCustomers: (updated: Customer[]) => void;
  onAddNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function Customers({ customers, onUpdateCustomers, onAddNotification }: CustomersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTagsString, setFormTagsString] = useState('');

  // Collect all unique tags for filter tabs
  const allTags = Array.from(
    new Set(customers.flatMap(c => c.tags || []))
  );

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = !selectedTag || c.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormNotes('');
    setFormTagsString('');
    setShowModal(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormPhone(cust.phone);
    setFormEmail(cust.email);
    setFormNotes(cust.notes);
    setFormTagsString(cust.tags.join(', '));
    setShowModal(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = formTagsString
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (editingCustomer) {
      // Edit
      const updated = customers.map(c => {
        if (c.id === editingCustomer.id) {
          return {
            ...c,
            name: formName,
            phone: formPhone,
            email: formEmail,
            notes: formNotes,
            tags
          };
        }
        return c;
      });
      onUpdateCustomers(updated);
      onAddNotification('Customer Updated', `${formName}'s profile was updated successfully.`, 'success');
    } else {
      // Add
      const newCust: Customer = {
        id: `c_${Math.floor(100 + Math.random() * 900)}`,
        name: formName,
        phone: formPhone,
        email: formEmail,
        notes: formNotes,
        lastConversation: 'Never contacted yet.',
        tags
      };
      onUpdateCustomers([...customers, newCust]);
      onAddNotification('Customer Created', `New profile created for ${formName}.`, 'success');
    }

    setShowModal(false);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer ${name}?`)) {
      const updated = customers.filter(c => c.id !== id);
      onUpdateCustomers(updated);
      onAddNotification('Customer Deleted', `${name} was removed from the database.`, 'info');
    }
  };

  return (
    <div id="customers-view" className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Customers</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage contact list, historical notes, and user segmentation tags.</p>
        </div>
        <button
          id="add-customer-btn"
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-755 transition-all text-xs w-fit cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Customer
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
              !selectedTag 
                ? 'bg-indigo-650 text-white shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100'
            }`}
          >
            All Customers
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                selectedTag === tag 
                  ? 'bg-indigo-650 text-white shadow-sm' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-3 h-3 text-slate-400" />
              {tag}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, phone, email..." 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
          />
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-12 rounded-xl text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-medium">No customers found matching the search criteria.</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <div 
              key={cust.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Customer header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${cust.name}`} 
                      alt={cust.name} 
                      className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800"
                    />
                    <div>
                      <h3 className="font-semibold text-slate-850 dark:text-white text-sm">{cust.name}</h3>
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">ID: {cust.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenEditModal(cust)}
                      className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                      title="Edit Customer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact items */}
                <div className="space-y-2 border-y border-slate-100 dark:border-slate-800/80 py-3.5 my-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">{cust.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{cust.email}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-400 uppercase tracking-wide text-[9px] block">Last Conversation</span>
                      <p className="mt-0.5 line-clamp-2 italic text-slate-550 dark:text-slate-400 text-[11px]">"{cust.lastConversation}"</p>
                    </div>
                  </div>
                </div>

                {/* Notes Block */}
                {cust.notes && (
                  <div className="mb-4 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-slate-500 text-[9px] font-semibold uppercase tracking-wider mb-1">
                      <Notebook className="w-3.5 h-3.5 text-indigo-500" />
                      <span>CRM Merchant Notes</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{cust.notes}</p>
                  </div>
                )}
              </div>

              {/* Tags footer */}
              {cust.tags && cust.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {cust.tags.map((t, idx) => (
                    <span 
                      key={idx} 
                      className="text-[9px] font-semibold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded flex items-center gap-1 border border-indigo-100/40"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-lg max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-semibold text-slate-850 dark:text-white mb-5">
              {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
            </h2>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="John Doe" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+1 555-0100" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="john@example.com" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Segmentation Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={formTagsString}
                  onChange={(e) => setFormTagsString(e.target.value)}
                  placeholder="VIP, Coffee Lover, Local Buyer" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Historical CRM Notes</label>
                <textarea 
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Prefers dark roast coffee. Added notes about local shipping..." 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none resize-none dark:text-white"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-755 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
