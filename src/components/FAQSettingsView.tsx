import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  MapPin, 
  Mail, 
  Clock, 
  Plus, 
  HelpCircle, 
  Sparkles, 
  Trash2, 
  Edit, 
  Check, 
  Filter, 
  Info,
  X,
  AlertCircle
} from 'lucide-react';
import { FAQ, BusinessProfile } from '../types';

interface FAQSettingsViewProps {
  businessProfile: BusinessProfile;
  faqs: FAQ[];
  onUpdateProfile: (updated: BusinessProfile) => void;
  onUpdateFAQs: (updated: FAQ[]) => void;
}

export default function FAQSettingsView({
  businessProfile,
  faqs,
  onUpdateProfile,
  onUpdateFAQs
}: FAQSettingsViewProps) {
  const [profileForm, setProfileForm] = useState<BusinessProfile>(businessProfile);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);

  // Form states for new/editing FAQ
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [faqCategory, setFaqCategory] = useState<'Pricing' | 'Location' | 'Shipping' | 'General'>('General');
  const [faqTags, setFaqTags] = useState('');

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    alert('Business Profile updated successfully!');
  };

  const handleToggleStatus = () => {
    const updated = { ...profileForm, statusOn: !profileForm.statusOn };
    setProfileForm(updated);
    onUpdateProfile(updated);
  };

  const handleOpenAddModal = () => {
    setEditingFAQ(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqCategory('General');
    setFaqTags('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setFaqCategory(faq.category);
    setFaqTags(faq.tags ? faq.tags.join(', ') : '');
    setShowAddModal(true);
  };

  const handleDeleteFAQ = (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ item?')) {
      const updated = faqs.filter(f => f.id !== id);
      onUpdateFAQs(updated);
    }
  };

  const handleSaveFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;

    const parsedTags = faqTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    if (editingFAQ) {
      // Edit existing
      const updated = faqs.map(f => f.id === editingFAQ.id ? {
        ...f,
        question: faqQuestion,
        answer: faqAnswer,
        category: faqCategory,
        tags: parsedTags
      } : f);
      onUpdateFAQs(updated);
    } else {
      // Add new
      const newFaq: FAQ = {
        id: 'faq_' + Date.now(),
        question: faqQuestion,
        answer: faqAnswer,
        category: faqCategory,
        tags: parsedTags
      };
      onUpdateFAQs([...faqs, newFaq]);
    }
    setShowAddModal(false);
  };

  const categories: Array<'Pricing' | 'Location' | 'Shipping' | 'General'> = [
    'Pricing', 'Location', 'Shipping', 'General'
  ];

  const filteredFaqs = filterCategory === 'All' 
    ? faqs 
    : faqs.filter(f => f.category === filterCategory);

  return (
    <div className="space-y-8 text-left pb-16" id="faq-settings-container">
      {/* Top Header with Interactive Toggle Status (Screen 5) */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="text-left">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-on-surface">
            Automation Configuration
          </h2>
          <p className="font-sans text-sm text-on-surface-variant mt-0.5">
            Manage your business profile and automated AI triggers.
          </p>
        </div>

        {/* Global Toggle Box Component */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-outline-variant/30 shrink-0">
          <span className="font-sans font-bold text-xs text-on-surface">AUTOMATION ENGINE STATUS</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={profileForm.statusOn} 
              onChange={handleToggleStatus}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-success-whatsapp after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
          <span className={`font-sans font-extrabold text-xs uppercase tracking-wider ${profileForm.statusOn ? 'text-success-whatsapp' : 'text-error'}`}>
            {profileForm.statusOn ? 'Active ON' : 'Paused OFF'}
          </span>
        </div>
      </header>

      {/* Bento Grid layout represent Section 1 and 2 from Screen 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Business Information form */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-outline-variant/20 pb-4">
              <Building className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-lg text-on-surface text-left">Your Store Profile</h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-bold text-xs text-on-surface-variant">Business Name</label>
                  <input 
                    type="text" 
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-primary focus:outline-none bg-surface-container-lowest font-sans text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-bold text-xs text-on-surface-variant">Support Email</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full border border-outline-variant rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary focus:outline-none bg-surface-container-lowest font-sans text-sm"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-on-surface-variant">Store Front Address</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full border border-outline-variant rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary focus:outline-none bg-surface-container-lowest font-sans text-sm"
                  />
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-bold text-xs text-on-surface-variant">Mon-Fri Working Hours</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={profileForm.hoursWeekdays}
                      onChange={(e) => setProfileForm({ ...profileForm, hoursWeekdays: e.target.value })}
                      className="w-full border border-outline-variant rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary focus:outline-none bg-surface-container-lowest font-sans text-sm"
                    />
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-sans font-bold text-xs text-on-surface-variant">Sat-Sun Working Hours</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={profileForm.hoursWeekends}
                      onChange={(e) => setProfileForm({ ...profileForm, hoursWeekends: e.target.value })}
                      className="w-full border border-outline-variant rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary focus:outline-none bg-surface-container-lowest font-sans text-sm"
                    />
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="pt-2 text-left">
                <button 
                  type="submit" 
                  className="bg-primary text-white px-6 py-3 rounded-xl font-sans font-bold text-sm hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  Save Business Details
                </button>
              </div>
            </form>
          </div>

          {/* AI Model Health Card placeholder graphic */}
          <div className="h-44 rounded-2xl overflow-hidden relative shadow-md bg-gradient-to-r from-primary via-primary-container to-secondary" id="ai-model-health-promo">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex flex-col justify-end p-6 text-white text-left">
              <span className="bg-white/20 text-white w-fit px-2.5 py-0.5 rounded-full font-sans text-[10px] uppercase font-extrabold mb-1">
                Active Learning Syncing
              </span>
              <h4 className="font-display font-extrabold text-lg">AI Model Context Health</h4>
              <p className="font-sans text-xs opacity-90 mt-0.5">
                Our model auto-updates training based on your business profile details above. Currently resolved 42 positive conversions.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: FAQ Library Pane list */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-white shadow-sm rounded-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
            <div className="p-4 bg-surface-container-low flex justify-between items-center border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold text-base text-on-surface">FAQ Library</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Category filters dropdown simulation */}
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-white border border-outline-variant rounded-lg text-xs font-sans px-2 py-1 text-on-surface-variant focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Pricing">Pricing</option>
                  <option value="Location">Location</option>
                  <option value="Shipping">Shipping</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-outline-variant/30 max-h-[440px] overflow-y-auto custom-scrollbar">
              {filteredFaqs.length === 0 ? (
                <div className="p-8 text-center text-outline font-sans text-sm">
                  No FAQ items matched the filter category.
                </div>
              ) : (
                filteredFaqs.map((faq) => (
                  <div key={faq.id} className="p-4 hover:bg-surface-container-low/40 transition-colors group relative text-left">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`text-[9px] uppercase font-sans font-extrabold px-2 py-0.5 rounded-full border ${
                        faq.category === 'Pricing' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : faq.category === 'Location' 
                          ? 'bg-tertiary-container/10 text-tertiary border-tertiary-container/20'
                          : faq.category === 'Shipping' 
                          ? 'bg-secondary/10 text-secondary border-secondary/20' 
                          : 'bg-outline-variant/20 text-on-surface-variant border-outline-variant/30'
                      }`}>
                        {faq.category}
                      </span>
                      {/* Interactive row settings */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEditModal(faq)}
                          className="p-1 text-primary hover:bg-primary/10 rounded cursor-pointer" 
                          title="Edit FAQ"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFAQ(faq.id)}
                          className="p-1 text-error hover:bg-error/10 rounded cursor-pointer" 
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-sans font-bold text-sm text-on-surface mb-1">
                      {faq.question}
                    </h4>
                    <p className="font-sans text-xs text-on-surface-variant line-clamp-3 italic leading-relaxed pl-1 border-l-2 border-outline-variant">
                      "{faq.answer}"
                    </p>
                    {faq.tags && faq.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {faq.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] font-sans font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200/40">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Step Add new action standard button */}
            <div className="p-4 bg-surface-bright text-center border-t border-outline-variant/20">
              <button 
                onClick={handleOpenAddModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-outline-variant/60 text-on-surface-variant font-sans font-semibold text-xs rounded-xl hover:border-primary hover:text-primary hover:bg-surface-container-low transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New FAQ Item
              </button>
            </div>
          </div>

          {/* AI Suggestion recommendation card box */}
          <div className="bg-primary-container text-white p-5 rounded-2xl flex gap-3 items-start shadow-sm text-left">
            <Sparkles className="w-5 h-5 shrink-0 text-white mt-0.5 fill-white" />
            <div>
              <h5 className="font-sans font-bold text-xs uppercase tracking-wide">AI Recommendation Suggestion</h5>
              <p className="font-sans text-xs opacity-90 mt-1 leading-relaxed">
                We've auto-detected several customer inquiries asking about "Vegan Options" and "Discount Codes". Consider adding an FAQ answering those to increase click-throughs!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Floating Action Button (FAB) in bottom right corner */}
      <button 
        onClick={handleOpenAddModal}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer"
        title="Quick Add FAQ"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add / Edit FAQ Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="add-faq-modal-back">
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-2xl p-6 md:p-8 max-w-lg w-full text-left relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-outline hover:text-on-surface cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-lg text-on-surface mb-2">
              {editingFAQ ? 'Edit FAQ Item' : 'Create New FAQ'}
            </h3>
            <p className="font-sans text-xs text-on-surface-variant mb-6">
              Automate responses for commonly asked customer questions by matching category intents.
            </p>

            <form onSubmit={handleSaveFAQ} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="font-sans font-bold text-xs text-on-surface-variant">Category Topic</label>
                <div className="flex gap-2 flex-wrap pt-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFaqCategory(cat)}
                      className={`px-3 py-1 bg-surface-alt hover:bg-surface-container rounded-lg text-xs font-sans font-bold border transition-colors cursor-pointer ${
                        faqCategory === cat 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-outline-variant/30 text-on-surface-variant'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-on-surface-variant">Inquiry Question</label>
                <input 
                  type="text" 
                  required
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  className="border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-primary focus:outline-none font-sans text-sm"
                  placeholder="e.g. Do you offer vegan dairy-free pastries?"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-on-surface-variant">Automated Reply Answer</label>
                <textarea 
                  required
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  rows={4}
                  className="border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-primary focus:outline-none font-sans text-sm resize-none"
                  placeholder="e.g. Yes! We offer delicious dairy-free almond-milk cupcakes and vegan gluten-free options daily. DM us to reserve!"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-on-surface-variant flex items-center gap-1">
                  Categorized Tags <span className="text-[10px] text-outline font-normal">(comma-separated)</span>
                </label>
                <input 
                  type="text" 
                  value={faqTags}
                  onChange={(e) => setFaqTags(e.target.value)}
                  className="border border-outline-variant rounded-xl p-3 focus:ring-2 focus:ring-primary focus:outline-none font-sans text-sm"
                  placeholder="e.g. pastries, vegan, allergens"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-surface-alt hover:bg-surface-container text-on-surface-variant font-sans font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white hover:bg-primary-container font-sans font-bold text-xs rounded-xl shadow-md"
                >
                  {editingFAQ ? 'Update FAQ' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
