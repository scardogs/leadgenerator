"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { 
  ArrowLeft, 
  ExternalLink, 
  RefreshCcw,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface Lead {
  _id: string;
  title?: string;
  query?: string;
  position?: number | string;
  snippet?: string;
  link?: string;
}

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (res.ok) {
        setLeads(data);
      } else {
        setError(data.error || 'Failed to fetch leads');
      }
    } catch (err) {
      setError('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = leads.filter(l => 
    (l.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.query || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight">All Leads</h1>
            <p className="text-muted-foreground">Manage and export your gathered business opportunities.</p>
          </div>
          <button 
            onClick={fetchLeads}
            className="flex items-center gap-2 px-4 py-2 bg-muted border border-border rounded-xl hover:bg-accent transition-all text-sm font-medium"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search by title or query..."
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-muted border border-border rounded-2xl hover:bg-accent transition-all text-sm font-medium">
            <Filter size={18} /> Filters
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center bg-destructive/5 text-destructive border border-destructive/20 rounded-2xl">
            <p className="font-bold">Error loading leads</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLeads.map((lead: Lead) => (
              <div key={lead._id} className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="absolute top-4 right-4 text-[10px] font-bold text-muted-foreground/30 uppercase">
                  Pos {lead.position}
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{lead.query}</span>
                    <h3 className="text-lg font-bold line-clamp-1 group-hover:text-indigo-500 transition-colors">{lead.title || 'No Title'}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 italic">
                    &quot;{lead.snippet}&quot;
                  </p>
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <a 
                      href={lead.link || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold inline-flex items-center gap-1 hover:underline"
                    >
                      Source <ExternalLink size={12} />
                    </a>
                    <button className="text-[10px] font-bold bg-muted px-2 py-1 rounded-md uppercase tracking-tighter">
                      Analysis
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredLeads.length === 0 && !loading && (
          <div className="text-center py-20 bg-muted/30 border-2 border-dashed border-border rounded-3xl">
            <p className="text-muted-foreground font-medium">No results found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsPage;
