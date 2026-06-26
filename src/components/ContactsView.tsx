import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Trash2,
  User,
  Mail,
  Phone,
  Database,
  X,
  CheckCircle,
  Users,
} from 'lucide-react';
import { Contact } from '../types';
import TablePagination from './TablePagination';
import { usePagination } from '../hooks/usePagination';
import { WorkspacePageHero, WorkspaceSummaryCard, WorkspaceFooter } from './ui/WorkspacePageHero';

interface ContactsViewProps {
  contacts: Contact[];
  onSaveContact: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
}

export default function ContactsView({
  contacts,
  onSaveContact,
  onDeleteContact,
}: ContactsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Instagram' | 'Automation'>('All');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState<'Instagram' | 'Automation'>('Automation');

  const handleDeleteLead = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete lead @${name}?`)) {
      onDeleteContact(id);
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
      dateAdded: 'Today',
      status: 'pending',
      revenue: 0,
    };

    onSaveContact(newLead);
    setShowAddLeadModal(false);
    setUsername('');
    setPhone('');
    setEmail('');
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Customer Username', 'Lead Source', 'Contact Phone', 'Contact Email', 'Date Captured'],
    ];

    contacts.forEach((c) => {
      csvRows.push([`@${c.username}`, c.source, c.phone, c.email, c.dateAdded]);
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      csvRows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `assistly_dm_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (sourceFilter === 'All') return matchesSearch;
    return matchesSearch && c.source === sourceFilter;
  });

  const {
    page,
    pageSize,
    setPage,
    setPageSize,
    totalCount: filteredTotal,
    paginatedItems: pageContacts,
  } = usePagination(filteredContacts, {
    resetKey: `${searchQuery}-${sourceFilter}`,
  });

  const totalLeads = contacts.length;
  const convertedLeads = contacts.filter((c) => c.status === 'paid').length;
  const totalRevenue = contacts.reduce(
    (acc, c) => acc + (c.status === 'paid' ? (c.revenue || 0) : 0),
    0
  );

  return (
    <div className="workspace-page space-y-6" id="contacts-crm-block">
      <WorkspacePageHero
        badge="Lead CRM"
        title="Collected Contacts"
        subtitle="Every phone, email, and DM lead captured by your automations — organized, searchable, and ready to convert."
        chipTitle="Leads synced"
        chipSubtitle="From Instagram & automations"
        visualIcon={<Users className="w-16 h-16" strokeWidth={1.5} />}
        actions={
          <>
            <button
              type="button"
              onClick={handleExportCSV}
              id="btn-crm-export"
              className="bg-primary text-white px-8 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-3 hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setShowAddLeadModal(true)}
              className="bg-transparent border border-outline-variant text-on-surface px-8 py-3.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-surface-container-low transition-all"
            >
              <Plus className="w-5 h-5" />
              Manual Lead
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WorkspaceSummaryCard
          title={`${totalLeads}`}
          label="Total captured leads"
          hint="All contacts in your CRM"
          accent="primary"
          pulse={totalLeads > 0}
          icon={<User className="w-5 h-5" />}
          watermarkIcon={<User className="w-24 h-24 text-primary" />}
        />
        <WorkspaceSummaryCard
          title={`${convertedLeads} paid`}
          label="Converted leads"
          hint="Marked as paid in CRM"
          accent="secondary"
          icon={<CheckCircle className="w-5 h-5" />}
          watermarkIcon={<CheckCircle className="w-24 h-24 text-secondary" />}
        />
        <WorkspaceSummaryCard
          title={`₹${totalRevenue.toLocaleString('en-IN')}`}
          label="Revenue tracked (INR)"
          hint="From paid lead records"
          accent="tertiary"
          icon={<Database className="w-5 h-5" />}
          watermarkIcon={<Database className="w-24 h-24 text-tertiary" />}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, email..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-outline-variant rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm text-sm outline-none"
            />
          </div>
          <div className="bg-surface-container-low p-1 rounded-xl flex items-center border border-outline-variant/30">
            {(['All', 'Instagram', 'Automation'] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setSourceFilter(src)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  sourceFilter === src
                    ? 'bg-white shadow-sm text-on-surface'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {src === 'All' ? 'All Sources' : src}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-surface-container overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container-lowest">
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline">
                    Customer Profile
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline">
                    Source
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline">
                    Phone
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline">
                    Email
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline">
                    Status
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline">
                    Revenue
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold uppercase tracking-widest text-outline text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {pageContacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-outline text-sm">
                      No collected contacts matching your search.
                    </td>
                  </tr>
                ) : (
                  pageContacts.map((lead) => (
                    <tr key={lead.id} className="table-row-hover transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary font-bold uppercase shrink-0">
                            {lead.username.substring(0, 1)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">@{lead.username}</p>
                            <p className="text-xs text-outline font-mono">ID: {lead.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            lead.source === 'Instagram'
                              ? 'bg-secondary-fixed text-on-secondary-fixed'
                              : 'bg-primary-fixed text-on-primary-fixed'
                          }`}
                        >
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">{lead.phone}</td>
                      <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">{lead.email}</td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status || 'pending'}
                          onChange={(e) => onSaveContact({ ...lead, status: e.target.value })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer bg-white ${
                            lead.status === 'paid'
                              ? 'text-success-whatsapp border-success-whatsapp/30'
                              : lead.status === 'failed'
                              ? 'text-red-600 border-red-200'
                              : 'text-on-surface-variant border-outline-variant'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {lead.status === 'paid' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-success-whatsapp font-bold text-xs">₹</span>
                            <input
                              key={`revenue-${lead.id}-${lead.revenue ?? 0}`}
                              type="number"
                              defaultValue={lead.revenue || 0}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                if (val !== (lead.revenue || 0)) {
                                  onSaveContact({ ...lead, revenue: val });
                                }
                              }}
                              className="w-20 bg-white border border-outline-variant/30 rounded-lg px-2 py-1 text-xs font-mono font-bold outline-none text-on-surface focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        ) : (
                          <span className="text-outline text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-outline hidden sm:inline">{lead.dateAdded}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id, lead.username)}
                            className="p-2 hover:bg-error-container hover:text-on-error-container rounded-lg transition-all text-on-surface-variant"
                            title="Delete lead"
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
          <TablePagination
            page={page}
            pageSize={pageSize}
            totalCount={filteredTotal}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="contacts"
            variant="reference"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-surface-container-low flex gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h5 className="font-semibold text-sm text-on-surface">Secured CRM storage</h5>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            Leads are stored securely and synced with your connected Instagram account. Export anytime as CSV.
          </p>
        </div>
      </div>

      <WorkspaceFooter />

      {showAddLeadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl border border-surface-container shadow-2xl p-6 md:p-8 max-w-lg w-full text-left relative">
            <button
              type="button"
              onClick={() => setShowAddLeadModal(false)}
              className="absolute right-4 top-4 text-outline hover:text-on-surface"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-lg text-on-surface mb-1">Add Manual Contact</h3>
            <p className="text-xs text-on-surface-variant mb-6">Insert a lead manually into your CRM.</p>

            <form onSubmit={handleAddManualLead} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-xs text-on-surface-variant">Instagram username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-sm">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                    placeholder="username"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-xs text-on-surface-variant">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-xs text-on-surface-variant">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-4 h-4" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-outline-variant rounded-xl p-3 pl-10 focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-xs text-on-surface-variant">Source</label>
                <div className="flex gap-2">
                  {(['Instagram', 'Automation'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSource(s)}
                      className={`flex-1 py-2 border rounded-xl text-xs font-semibold ${
                        source === s
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-outline-variant/30 text-on-surface-variant'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 text-on-surface-variant font-semibold text-xs rounded-xl hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-white font-semibold text-xs rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
