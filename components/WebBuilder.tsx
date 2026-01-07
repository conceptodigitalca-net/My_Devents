import React, { useState, useEffect } from 'react';
import { User, Invitation } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvitation, updateInvitation } from '../services/mockBackend';
import { ArrowLeft, Save, Monitor, MousePointer2, Layout, Type, Image as ImageIcon, Plus } from 'lucide-react';

const WebBuilder: React.FC<{ user: User }> = ({ user }) => {
    const { invitationId } = useParams();
    const navigate = useNavigate();
    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Mock Content State for Web Builder
    // In a real app, this would be a structured JSON of sections (Hero, About, Details, RSVP)
    const [sections, setSections] = useState<string[]>(['Hero Section', 'Event Details']);

    useEffect(() => {
        if (invitationId) {
            getInvitation(invitationId).then(inv => {
                if (inv) {
                    setInvitation(inv);
                    // Load saved content if exists
                    // if (inv.content?.sections) setSections(inv.content.sections);
                }
                setLoading(false);
            });
        }
    }, [invitationId]);

    const handleSave = async () => {
        if (!invitation) return;
        setSaving(true);
        try {
            await updateInvitation(invitation.id, {
                content: { ...invitation.content, scenes: [] } // Save web specific content here
            });
            await new Promise(resolve => setTimeout(resolve, 500)); // Sim delay
            alert("Design saved successfully!");
        } catch (err) {
            alert("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Loading Web Builder...</div>;
    if (!invitation) return <div className="flex h-screen items-center justify-center text-red-500">Invitation not found.</div>;

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
            {/* Header */}
            <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/invitations')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {invitation.name}
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wide">WEB</span>
                        </h1>
                        <p className="text-xs text-slate-400">Web Invitation Builder</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-70"
                    >
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Design'}
                    </button>
                </div>
            </div>

            {/* Builder Area (Placeholder Structure) */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar (Components) */}
                <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Components</h3>
                    </div>
                    <div className="flex-1 p-4 space-y-2">
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-600 dark:text-slate-300 transition-all text-left">
                            <Layout size={18} /> <span>Hero Section</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-600 dark:text-slate-300 transition-all text-left">
                            <Type size={18} /> <span>Text Block</span>
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-600 dark:text-slate-300 transition-all text-left">
                            <ImageIcon size={18} /> <span>Photo Gallery</span>
                        </button>
                    </div>
                </div>

                {/* Main Canvas (Desktop View) */}
                <div className="flex-1 bg-slate-200 dark:bg-black/20 p-8 overflow-y-auto flex justify-center">
                    <div className="w-full max-w-5xl bg-white min-h-[800px] shadow-2xl rounded-sm flex flex-col">
                        {/* Placeholder Content */}
                        <div className="h-64 bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center border-b border-dashed border-slate-300">
                            <p className="text-slate-400 font-medium">Hero Section Area</p>
                        </div>
                        <div className="p-12 space-y-4">
                            <div className="h-8 w-1/3 bg-slate-100 rounded"></div>
                            <div className="h-4 w-full bg-slate-50 rounded"></div>
                            <div className="h-4 w-full bg-slate-50 rounded"></div>
                            <div className="h-4 w-2/3 bg-slate-50 rounded"></div>
                        </div>
                        <div className="mt-auto p-12 bg-slate-50 border-t border-slate-100 text-center">
                            <p className="text-slate-400">Footer Area</p>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (Properties) */}
                <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm mb-4">Page Properties</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Page Title</label>
                            <input className="w-full border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded p-2 text-sm" defaultValue={invitation.name} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Theme Color</label>
                            <div className="flex gap-2">
                                <div className="w-6 h-6 rounded-full bg-white border cursor-pointer"></div>
                                <div className="w-6 h-6 rounded-full bg-black cursor-pointer"></div>
                                <div className="w-6 h-6 rounded-full bg-indigo-500 cursor-pointer ring-2 ring-offset-2 ring-indigo-500"></div>
                                <div className="w-6 h-6 rounded-full bg-pink-500 cursor-pointer"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebBuilder;