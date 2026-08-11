/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category, Product } from '../types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Grid, 
  Tag, 
  IndianRupee, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpDown 
} from 'lucide-react';

interface MenuProps {
  businessId: string;
  initialSearchQuery?: string;
  onClearInitialSearchQuery?: () => void;
}

export default function MenuManagement({ businessId, initialSearchQuery, onClearInitialSearchQuery }: MenuProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle preset initial search query
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      setSelectedCategory('all'); // Clear category filter to show item
      if (onClearInitialSearchQuery) {
        onClearInitialSearchQuery();
      }
    }
  }, [initialSearchQuery, onClearInitialSearchQuery]);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form states - Product
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(100);
  const [prodDesc, setProdDesc] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodAvailable, setProdAvailable] = useState(true);

  // Form states - Category
  const [catName, setCatName] = useState('');

  // Bulk Edit Price states
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('all');
  const [bulkAction, setBulkAction] = useState<'increase' | 'decrease'>('increase');
  const [bulkValue, setBulkValue] = useState(10);
  const [bulkType, setBulkType] = useState<'percentage' | 'absolute'>('percentage');

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const catSnap = await getDocs(collection(db, 'businesses', businessId, 'categories'));
      const catList = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      setCategories(catList.sort((a, b) => a.displayOrder - b.displayOrder));

      const prodSnap = await getDocs(collection(db, 'businesses', businessId, 'products'));
      const prodList = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setProducts(prodList);
      
      if (catList.length > 0 && !prodCatId) {
        setProdCatId(catList[0].id);
      }
    } catch (err: any) {
      setError('Failed to fetch menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [businessId]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!prodName || !prodPrice || !prodCatId) {
      setError('Required fields are missing');
      return;
    }

    try {
      if (editingProduct) {
        // Edit existing product
        const docRef = doc(db, 'businesses', businessId, 'products', editingProduct.id);
        await updateDoc(docRef, {
          name: prodName,
          price: Number(prodPrice),
          description: prodDesc,
          categoryId: prodCatId,
          isAvailable: prodAvailable,
        });
        setSuccess('Product updated successfully!');
      } else {
        // Create new product
        const colRef = collection(db, 'businesses', businessId, 'products');
        const docRef = await addDoc(colRef, {
          name: prodName,
          price: Number(prodPrice),
          description: prodDesc,
          categoryId: prodCatId,
          isAvailable: prodAvailable,
        });
        // Update local status with doc id
        await updateDoc(docRef, { id: docRef.id });
        setSuccess('Product added successfully!');
      }

      setShowProductModal(false);
      setEditingProduct(null);
      resetProductForm();
      fetchMenu();
    } catch (err: any) {
      setError('Error saving product.');
    }
  };

  const resetProductForm = () => {
    setProdName('');
    setProdPrice(100);
    setProdDesc('');
    setProdAvailable(true);
    if (categories.length > 0) {
      setProdCatId(categories[0].id);
    }
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdPrice(prod.price);
    setProdDesc(prod.description);
    setProdCatId(prod.categoryId);
    setProdAvailable(prod.isAvailable);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'businesses', businessId, 'products', prodId));
      setSuccess('Product deleted successfully');
      fetchMenu();
    } catch (err) {
      setError('Failed to delete product.');
    }
  };

  const handleToggleAvailability = async (prod: Product) => {
    try {
      const docRef = doc(db, 'businesses', businessId, 'products', prod.id);
      await updateDoc(docRef, { isAvailable: !prod.isAvailable });
      setProducts(products.map(p => p.id === prod.id ? { ...p, isAvailable: !p.isAvailable } : p));
    } catch (err) {
      setError('Failed to update product availability.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    try {
      const colRef = collection(db, 'businesses', businessId, 'categories');
      const order = categories.length + 1;
      const docRef = await addDoc(colRef, {
        name: catName,
        displayOrder: order,
      });
      await updateDoc(docRef, { id: docRef.id });

      setSuccess('Category added successfully!');
      setCatName('');
      setShowCategoryModal(false);
      fetchMenu();
    } catch (err) {
      setError('Failed to add category.');
    }
  };

  const handleBulkPriceChange = async () => {
    setError('');
    setSuccess('');

    // Filter products that match the selected category
    const targetProducts = products.filter((p) => bulkCategory === 'all' || p.categoryId === bulkCategory);

    if (targetProducts.length === 0) {
      setError('No products found in the selected category to update.');
      return;
    }

    try {
      const batch = writeBatch(db);
      targetProducts.forEach((prod) => {
        let newPrice = prod.price;
        const valueNum = Number(bulkValue);

        if (bulkType === 'percentage') {
          const factor = bulkAction === 'increase' ? (1 + valueNum / 100) : (1 - valueNum / 100);
          newPrice = Math.round(prod.price * factor);
        } else {
          newPrice = bulkAction === 'increase' ? (prod.price + valueNum) : (prod.price - valueNum);
        }

        // Ensure price is not negative
        if (newPrice < 0) newPrice = 0;

        const ref = doc(db, 'businesses', businessId, 'products', prod.id);
        batch.update(ref, { price: newPrice });
      });

      await batch.commit();
      setSuccess(`Successfully updated prices for ${targetProducts.length} products!`);
      setShowBulkEdit(false);
      fetchMenu();
    } catch (err) {
      setError('Error bulk updating prices.');
    }
  };

  // Filter products by UI selectors
  const filteredProducts = products.filter((prod) => {
    const matchesCat = selectedCategory === 'all' || prod.categoryId === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="menu-management-panel">
      {/* Top Banner Control Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Menu & Product Management</h2>
          <p className="text-xs text-gray-400 mt-1">Configure your catalog items. Changes update the Leo AI assistant immediately.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowBulkEdit(!showBulkEdit)}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Bulk Edit Prices
          </button>
          <button
            onClick={() => {
              setCatName('');
              setShowCategoryModal(true);
            }}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
          >
            <Tag className="w-4 h-4 text-emerald-400" />
            Add Category
          </button>
          <button
            onClick={() => {
              resetProductForm();
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition"
          >
            <Plus className="w-4 h-4 text-black" />
            Add New Product
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bulk Price Adjustment Drawer/Panel */}
      {showBulkEdit && (
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl space-y-4 animate-slide-down">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 font-display">
            <TrendingUp className="w-4.5 h-4.5" />
            Bulk Price Adjuster Tool
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">For Category</label>
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-white text-xs outline-none focus:border-emerald-500"
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Action</label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as 'increase' | 'decrease')}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-white text-xs outline-none focus:border-emerald-500"
              >
                <option value="increase">Increase Prices By</option>
                <option value="decrease">Decrease Prices By</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Adjustment Value</label>
              <input
                type="number"
                min="1"
                value={bulkValue}
                onChange={(e) => setBulkValue(Number(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-white text-xs outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Unit Type</label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value as 'percentage' | 'absolute')}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2 text-white text-xs outline-none focus:border-emerald-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="absolute">Flat Amount (₹)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleBulkPriceChange}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs py-2 rounded-lg cursor-pointer transition"
              >
                Apply Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Horizontal Scroller & Search Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0a0a0a] border border-white/5 px-6 py-4 rounded-2xl">
        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`
              px-4 py-2 rounded-xl text-xs font-semibold border flex-shrink-0 cursor-pointer transition
              ${selectedCategory === 'all'
                ? 'bg-emerald-500 border-emerald-500 text-black'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }
            `}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-4 py-2 rounded-xl text-xs font-semibold border flex-shrink-0 cursor-pointer transition
                ${selectedCategory === cat.id
                  ? 'bg-emerald-500 border-emerald-500 text-black'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }
              `}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-white text-xs focus:border-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Products Grid / Table list */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Grid className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">No products found matching your selections</p>
            <p className="text-gray-500 text-xs mt-1">Try resetting your filters or adding a new product</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">Availability</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((prod) => {
                  const cat = categories.find(c => c.id === prod.categoryId);
                  return (
                    <tr key={prod.id} className="hover:bg-white/5 transition duration-150">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-gray-300">
                            {prod.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{prod.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{prod.description || 'No description added'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-300 font-semibold">{cat ? cat.name : 'Unknown'}</td>
                      <td className="py-4 px-6 font-display font-bold text-sm text-white">₹{prod.price}</td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleAvailability(prod)}
                          className={`
                            px-3 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer
                            ${prod.isAvailable 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }
                          `}
                        >
                          {prod.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Category Creator */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-md font-bold text-white font-display">Create Product Category</h3>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Desserts 🍨"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Product Creator / Editor */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-md font-bold text-white font-display">
                {editingProduct ? 'Modify Product Specifications' : 'Add New Product to Catalog'}
              </h3>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Masala Dosa"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Price (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      required
                      min="0"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Category</label>
                  <select
                    value={prodCatId}
                    onChange={(e) => setProdCatId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0a0a0a]">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Availability Status</label>
                  <select
                    value={prodAvailable ? 'yes' : 'no'}
                    onChange={(e) => setProdAvailable(e.target.value === 'yes')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 outline-none"
                  >
                    <option value="yes" className="bg-[#0a0a0a]">Available / In Stock</option>
                    <option value="no" className="bg-[#0a0a0a]">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Product Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe ingredients, prep style, sizing, etc."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs"
                >
                  {editingProduct ? 'Save Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
