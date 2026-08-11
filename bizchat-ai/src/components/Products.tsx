import React, { useState } from 'react';
import { 
  Coffee, 
  Search, 
  Plus, 
  DollarSign, 
  Tag, 
  X, 
  Edit3, 
  Trash2, 
  Grid, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Product } from '../types';

interface ProductsProps {
  products: Product[];
  onUpdateProducts: (updated: Product[]) => void;
  onAddNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function Products({ products, onUpdateProducts, onAddNotification }: ProductsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Dialog state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('Beverages');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);

  const categories = ['Beverages', 'Accessories', 'Appliances', 'Foods'];

  // Collect unique categories for filters
  const allCategories = Array.from(
    new Set(products.map(p => p.category))
  );

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('');
    setFormCategory('Beverages');
    setFormDesc('');
    setFormImage('');
    setFormAvailable(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormPrice(prod.price.toString());
    setFormCategory(prod.category);
    setFormDesc(prod.description);
    setFormImage(prod.imageUrl || '');
    setFormAvailable(prod.available);
    setShowModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(formPrice) || 0;
    
    const imagePlaceholder = formImage || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=300';

    if (editingProduct) {
      // Edit
      const updated = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: formName,
            price,
            category: formCategory,
            description: formDesc,
            imageUrl: imagePlaceholder,
            available: formAvailable
          };
        }
        return p;
      });
      onUpdateProducts(updated);
      onAddNotification('Product Updated', `${formName} was edited successfully.`, 'success');
    } else {
      // Add
      const newProd: Product = {
        id: `p_${Math.floor(100 + Math.random() * 900)}`,
        name: formName,
        price,
        category: formCategory,
        description: formDesc,
        imageUrl: imagePlaceholder,
        available: formAvailable,
        createdAt: Date.now()
      };
      onUpdateProducts([newProd, ...products]);
      onAddNotification('Product Created', `Added ${formName} to the catalog.`, 'success');
    }

    setShowModal(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete product "${name}" from your catalog?`)) {
      const updated = products.filter(p => p.id !== id);
      onUpdateProducts(updated);
      onAddNotification('Product Removed', `"${name}" was deleted from your shop menu.`, 'info');
    }
  };

  const handleToggleAvailability = (prodId: string) => {
    const updated = products.map(p => {
      if (p.id === prodId) {
        const nextState = !p.available;
        onAddNotification(
          'Availability Changed', 
          `"${p.name}" is now ${nextState ? 'In Stock' : 'Out of Stock'}.`, 
          'info'
        );
        return { ...p, available: nextState };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  return (
    <div id="products-view" className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Products</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure catalog inventory, prices, and availability parameters.</p>
        </div>
        <button
          id="add-product-btn"
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-650 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-755 transition-all text-xs w-fit cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Product
        </button>
      </div>

      {/* Categories and Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center bg-white dark:bg-slate-900 p-3 border border-slate-200/85 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1.5 md:pb-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              !selectedCategory 
                ? 'bg-indigo-655 text-white shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-indigo-655 text-white shadow-sm' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..." 
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
          />
        </div>
      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-12 rounded-xl text-center">
            <Coffee className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-medium">No products found matching filters.</p>
          </div>
        ) : (
          filteredProducts.map((prod) => (
            <div 
              key={prod.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Product Image */}
                <div className="relative h-40 bg-slate-100">
                  <img 
                    src={prod.imageUrl} 
                    alt={prod.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-slate-900/70 text-white font-semibold text-[9px] px-2 py-0.5 rounded backdrop-blur-sm">
                    {prod.category}
                  </span>
                  
                  {/* Action buttons */}
                  <div className="absolute top-2.5 right-2.5 flex gap-0.5 bg-white/95 dark:bg-slate-900/95 p-0.5 rounded-lg shadow-sm backdrop-blur-sm">
                    <button 
                      onClick={() => handleOpenEditModal(prod)}
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                      title="Edit Product"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(prod.id, prod.name)}
                      className="p-1 text-slate-500 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-slate-850 dark:text-white text-xs line-clamp-1">{prod.name}</h3>
                    <span className="font-semibold text-slate-850 dark:text-indigo-400 font-mono text-xs shrink-0">
                      ${prod.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-550 line-clamp-2 leading-relaxed h-8">
                    {prod.description}
                  </p>
                </div>
              </div>

              {/* Toggle switch row */}
              <div className="px-4 pb-4 pt-2.5 border-t border-slate-100/60 dark:border-slate-800/60 flex items-center justify-between">
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${
                  prod.available ? 'text-emerald-650 dark:text-emerald-400' : 'text-rose-500'
                }`}>
                  {prod.available ? '● In Stock' : '○ Out of Stock'}
                </span>

                <button
                  onClick={() => handleToggleAvailability(prod.id)}
                  className={`w-8 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                    prod.available ? 'bg-indigo-650' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                    prod.available ? 'translate-x-3' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Product Creator/Editor Dialog */}
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
              {editingProduct ? 'Edit Product Item' : 'Create New Product'}
            </h2>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Premium Coffee Beans" 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Price ($ USD)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="24.99" 
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Image URL</label>
                <input 
                  type="url" 
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..." 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Product Description</label>
                <textarea 
                  rows={3}
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Describe your product specs, flavor notes, size or volume details..." 
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none resize-none dark:text-white"
                />
              </div>

              {/* Available toggle inside form */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-750">
                <span className="text-[11px] font-semibold text-slate-655 dark:text-slate-300">Mark item as instantly available</span>
                <button
                  type="button"
                  onClick={() => setFormAvailable(!formAvailable)}
                  className={`w-8 h-5 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                    formAvailable ? 'bg-indigo-650' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                    formAvailable ? 'translate-x-3' : 'translate-x-0'
                  }`} />
                </button>
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
                  Save Catalog Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
