import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Download, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Filter, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Database,
  Calendar,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Contact } from '../types';

interface ContactsViewProps {
  contacts: Contact[];
  onUpdateContacts: (updated: Contact[]) => void;
}

export default function ContactsView({
  contacts,
  onUpdateContacts
}: ContactsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Instagram' | 'Automation'>('All');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // New Lead states
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<'Instagram' | 'Automation'>('Automation');

  const handleDeleteLead = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete lead @${name}?`)) {
      const updated = contacts.filter(c => c.id !== id);
      onUpdateContacts(updated);
    }
  };

  const handleAddManualLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !phone.trim() || !email.trim()) return;

    let cleanUsername = username.trim();
    if (cleanUsername.startsWith('@')) {
      cleanUsername = cleanUsername.substring(1);
    }

    const newLead: Contact = {
      id: 'lead_' + Date.now(),
      username: cleanUsername,
      phone: phone.trim(),
      email: email.trim(),
      source: source,
      dateAdded: 'Today'
    };

    onUpdateContacts([newLead, ...contacts]);
    setShowAddLeadModal(false);
    // Reset
    setUsername('');
    setPhone('');
    setEmail('');
  };

  // Real client-side CSV download compiler!
  const handleExportCSV = () => {
    const csvRows = [
      ['Customer Username', 'Lead Source', 'Contact Phone', 'Contact Email', 'Date Captured']
    ];

    contacts.forEach(c => {
      csvRows.push([
        `@${c.username}`,
        c.source,
        c.phone,
        c.email,
        c.dateAdded
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `assistly_dm_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter conditions
  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone.includes(searchQuery);
    
    if (sourceFilter === 'All') return matchesSearch;
    return matchesSearch && c.source === sourceFilter;
  });

  return (
    <div className="space-y-8 text-left pb-16" id="contacts-crm-block">
      
      {/* CRM Heading Banner */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="text-left">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-on-surface">
            Collected Contacts CRM
          </h2>
          <p className="font-sans text-sm text-on-surface-variant mt-0.5">
            Identify hot lead details captured 24/7 by your automated Instagram responder.
          </p>
        </div>

        {/* Sync Pillar Cluster metrics represent Screen 7 */}
        <div className="flex gap-4 items-center shrink-0">
          <div className="bg-white p-3 rounded-xl border border-outline-variant/30 text-left shadow-sm">
            <p className="font-sans text-[10px] text-outline uppercase font-bold leading-none mb-1">Active Threads</p>
            <p className="font-sans font-black text-sm text-on-surface">42 threads</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-outline-variant/30 text-left shadow-sm">
            <p className="font-sans text-[10px] text-outline uppercase font-bold leading-none mb-1">Weekly Growth</p>
            <p className="font-sans font-black text-sm text-success-whatsapp">+24 leads</p>
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="bg-primary text-white hover:bg-primary-container px-4 py-3 rounded-xl flex items-center gap-2 font-sans font-bold text-xs shadow-md transition-all cursor-pointer"
            id="btn-crm-export"
          >
            <Download className="w-4 h-4" /> Export CSV Spreadsheet
          </button>
        </div>
      </header>

      {/* CRM Main Frame panel */}
      <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
        
        {/* Search controls row */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search textfield */}
          <div className="relative w-full md:max-w-xs text-left">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, email..."
              className="w-full bg-white border border-outline-variant rounded-xl pl-10 pr-4 py-2 text-sm font-sans placeholder:text-outline/40 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          {/* Filters right side */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
            <div className="flex bg-white rounded-xl p-1 border border-outline-variant/50">
              <button 
                onClick={() => setSourceFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold cursor-pointer ${
                  sourceFilter === 'All' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                All Sources
              </button>
              <button 
                onClick={() => setSourceFilter('Instagram')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold cursor-pointer ${
                  sourceFilter === 'Instagram' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Instagram
              </button>
              <button 
                onClick={() => setSourceFilter('Automation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold cursor-pointer ${
                  sourceFilter === 'Automation' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Automation Direct
              </button>
            </div>

            <button 
              onClick={() => setShowAddLeadModal(true)}
              className="px-4 py-2 border-2 border-dashed border-outline-variant/60 text-outline hover:border-primary hover:text-primary rounded-xl font-sans font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Manual Lead
            </button>
          </div>
        </div>

        {/* Table representation (Matching Screen 7 layout) */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-sans border-collapse">
            <thead>
              <tr className="bg-surface-alt border-b border-outline-variant/30 text-[11px] font-bold text-outline uppercase tracking-wider">
                <th className="py-4 px-6">Customer Profile</th>
                <th className="py-4 px-6">Source / Platform</th>
                <th className="py-4 px-6">Contact Phone</th>
                <th className="py-4 px-6">Contact Email</th>
                <th className="py-4 px-6 text-right">Date Captured / Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-sm">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-outline font-sans text-sm">
                    No collected contacts matching the query.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-container-low/30 transition-colors font-sans">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-sans font-bold uppercase shrink-0">
                        {lead.username.substring(0, 1)}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-on-surface leading-none">@{lead.username}</p>
                        <p className="text-[10px] text-outline mt-1 font-mono">ID: {lead.id}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold leading-none ${
                        lead.source === 'Instagram' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-medium text-on-surface-variant">
                      {lead.phone}
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant">
                      {lead.email}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-xs text-outline font-medium mr-2">{lead.dateAdded}</span>
                        <button 
                          onClick={() => handleDeleteLead(lead.id, lead.username)}
                          className="w-8 h-8 rounded-lg text-error hover:bg-error/10 flex items-center justify-center transition-colors cursor-pointer" 
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer controls pagination simulation */}
        <div className="p-4 bg-surface-alt border-t border-outline-variant/20 flex justify-between items-center text-xs text-outline font-sans">
          <span>Row count: {filteredContacts.length} of {contacts.length} entries</span>
          <div className="flex gap-2">
            <button className="p-1 px-2 border border-outline-variant rounded hover:bg-surface-container transition-colors cursor-not-allowed" disabled>
              Prev
            </button>
            <button className="p-1 px-2 border border-outline-variant bg-white rounded shadow-sm text-on-surface font-semibold">
              1
            </button>
            <button className="p-1 px-2 border border-outline-variant rounded hover:bg-surface-container transition-colors cursor-not-allowed" disabled>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Database Security disclaimer panel */}
      <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30 flex gap-4 text-left font-sans">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h5 className="font-bold text-sm text-on-surface mb-0.5">Secured CRM Database Encryption</h5>
          <p className="text-xs text-on-surface-variant">
            All leads are stored locally and encrypted using AES-256 standard before being synced back with your authorized databases. Meets strict GDPR & CCPA privacy guidelines.
          </p>
        </div>
      </section>

      {/* Manual Add Lead Modal Dialog */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-outline-variant/30 shadow-2xl p-6 md:p-8 max-w-lg w-full text-left relative">
            <button 
              onClick={() => setShowAddLeadModal(false)}
              className="absolute right-4 top-4 text-outline hover:text-on-surface cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-lg text-on-surface mb-1">
              Add Manual Contact Lead
            </h3>
            <p className="font-sans text-xs text-on-surface-variant mb-6">
              Insert a walk-in client or phone lead manually into the CRM data logs.
            </p>

            <form onSubmit={handleAddManualLead} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-on-surface-variant">Instagram Username handle</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary focus:outline-none font-sans text-sm"
                    placeholder="e.g. delicious_bakes"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline font-sans text-sm">@</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-on-surface-variant">Phone Number</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary focus:outline-none font-sans text-sm"
                    placeholder="+1 (555) 0123"
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-on-surface-variant">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary focus:outline-none font-sans text-sm"
                    placeholder="client@mail.com"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans font-bold text-xs text-on-surface-variant">Capture Source</label>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSource('Instagram')}
                    className={`flex-1 py-2 border rounded-xl font-sans font-bold text-xs cursor-pointer ${
                      source === 'Instagram' ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    Instagram Mention
                  </button>
                  <button
                    type="button"
                    onClick={() => setSource('Automation')}
                    className={`flex-1 py-2 border rounded-xl font-sans font-bold text-xs cursor-pointer ${
                      source === 'Automation' ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    Direct Message Automation
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 bg-surface-alt hover:bg-surface-container text-on-surface-variant font-sans font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white hover:bg-primary-container font-sans font-bold text-xs rounded-xl shadow-md"
                >
                  Append CRM Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
