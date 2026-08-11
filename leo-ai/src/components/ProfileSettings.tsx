/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BusinessProfile } from '../types';
import { Store, Phone, MapPin, Clock, Navigation, Languages, FileText, Check, AlertCircle } from 'lucide-react';

interface ProfileProps {
  businessId: string;
  onProfileUpdate: (newName: string) => void;
}

export default function ProfileSettings({ businessId, onProfileUpdate }: ProfileProps) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [deliveryRadius, setDeliveryRadius] = useState(5);
  const [languages, setLanguages] = useState<string[]>([]);
  const [gst, setGst] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'businesses', businessId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as BusinessProfile;
          setProfile(data);
          setName(data.name || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setWhatsappNumber(data.whatsappNumber || '');
          setBusinessHours(data.businessHours || '');
          setDeliveryRadius(data.deliveryRadius || 5);
          setLanguages(data.languages || ['English']);
          setGst(data.gst || '');
        }
      } catch (err: any) {
        setError('Failed to fetch business profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [businessId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      const docRef = doc(db, 'businesses', businessId);
      const updatedData = {
        name,
        address,
        phone,
        whatsappNumber,
        businessHours,
        deliveryRadius: Number(deliveryRadius),
        languages,
        gst,
      };

      await updateDoc(docRef, updatedData);
      setSuccess(true);
      onProfileUpdate(name);
      
      // Auto-hide success message
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError('Failed to update business profile.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) {
        setLanguages(languages.filter((l) => l !== lang));
      }
    } else {
      setLanguages([...languages, lang]);
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
    <div className="max-w-4xl mx-auto bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-xl overflow-hidden" id="profile-settings-panel">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-transparent px-8 py-8 relative border-b border-white/5">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)] pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 border border-emerald-500/20 flex items-center justify-center font-extrabold text-black text-2xl font-display shadow-lg">
            {name ? name.charAt(0).toUpperCase() : 'B'}
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">{name || 'Your Business'}</h2>
            <p className="text-emerald-400 text-sm mt-0.5">Manage your digital storefront configuration & delivery details</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="p-8 space-y-6">
        {success && (
          <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm animate-fade-in">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>Success! Your business profile has been updated and synchronized instantly with Leo AI.</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Name */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Business Name</label>
            <div className="relative">
              <Store className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Restaurant"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* GST (Optional) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">GSTIN (Optional)</label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
                placeholder="e.g. 09AAACR1209B1ZN"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition uppercase"
              />
            </div>
          </div>

          {/* Phone Contact */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Contact Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">WhatsApp Cloud Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Operational Hours</label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="text"
                required
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g. 9:00 AM - 11:00 PM (Daily)"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Delivery Radius */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Radius (km)</label>
            <div className="relative">
              <Navigation className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
              <input
                type="number"
                min="1"
                max="100"
                required
                value={deliveryRadius}
                onChange={(e) => setDeliveryRadius(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Business Address</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-500" />
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Ground Floor, H-Block, Sector 62, Noida, UP - 201301"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
            />
          </div>
        </div>

        {/* Supported Languages */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Supported Languages on WhatsApp</label>
          <div className="flex flex-wrap gap-3">
            {['English', 'Hindi', 'Hinglish', 'Tamil', 'Kannada', 'Bengali'].map((lang) => {
              const isSelected = languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`
                    px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition cursor-pointer
                    ${isSelected 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-transparent border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Languages className="w-3.5 h-3.5" />
                  {lang}
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 mt-2">Leo AI will automatically tailor language patterns matching user selections</p>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-white/5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm px-6 py-2.5 rounded-xl transition duration-150 cursor-pointer disabled:opacity-55"
            id="save-profile-btn"
          >
            {saving ? 'Saving changes...' : 'Save Profile Config'}
          </button>
        </div>
      </form>
    </div>
  );
}
