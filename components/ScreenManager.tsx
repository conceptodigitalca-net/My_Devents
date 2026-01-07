
import React, { useState, useEffect } from 'react';
import { User, Event, WelcomeScreenDesign } from '../types';
import { getEvents, getWelcomeDesigns, createWelcomeDesign, deleteWelcomeDesign } from '../services/mockBackend';
import { useNavigate } from 'react-router-dom';
import { Tv, Calendar, Plus, Edit2, Trash2, Smartphone, Monitor, Layers, X, Check, MonitorCheck, Sparkles } from 'lucide-react';

interface ScreenManagerProps {
    user: User;
}

const ScreenManager: React.FC<ScreenManagerProps> = ({ user }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [designs, setDesigns] = useState<WelcomeScreenDesign[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newScreenName, setNewScreenName] = useState('');
    const [newScreenOrientation, setNewScreenOrientation] = useState<'landscape' | 'portrait'>('landscape');
    const [newScreenResType, setNewScreenResType] = useState<'HD' | '4K' | 'Custom'>('HD');
    const [newScreenCustomRes, setNewScreenCustomRes] = useState({ width: 1920, height: 1080 });

    useEffect(() => {
        const loadEvents = async () => {
            const partnerIds = user.role === 'SUPER_ADMIN' ? undefined : user.partnerIds;
            const fetchedEvents = await getEvents(partnerIds);
            setEvents(fetchedEvents);
            setLoading(false);
        };
        loadEvents();
    }, [user]);

    useEffect(() => {
        if (selectedEventId) {
            getWelcomeDesigns(selectedEventId).then(setDesigns);
        } else {
            setDesigns([]);
        }
    }, [selectedEventId]);

    const generateRandomName = () => {
        const zones = ['Lobby', 'Main Hall', 'Entrance', 'VIP Lounge', 'Bar', 'Stage', 'Outdoor', 'Reception', 'Check-in'];
        const types = ['Totem', 'Display', 'Screen', 'Monitor', 'LED Wall', 'Kiosk', 'Signage', 'Welcome Board'];
        
        const randomZone = zones[Math.floor(Math.random() * zones.length)];
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        return `${randomZone} - ${randomType}`;
    };

    const handleOpenCreateModal = () => {
        if (!selectedEventId) return;
        setNewScreenName(generateRandomName()); // Auto-generate name on open
        setNewScreenOrientation('landscape');
        setNewScreenResType('HD');
        setIsCreateModalOpen(true);
    };

    const handleGenerateNameClick = () => {
        setNewScreenName(generateRandomName());
    };

    const handleCreateDesign = async () => {
        if (!selectedEventId) return;
        const event = events.find(e => e.id === selectedEventId);
        if (!event) return;

        let width = 1920;
        let height = 1080;

        // 1. Determine base dimensions from Type
        if (newScreenResType === 'HD') {
            width = 1920;
            height = 1080;
        } else if (newScreenResType === '4K') {
            width = 3840;
            height = 2160;
        } else {
            width = newScreenCustomRes.width || 1920;
            height = newScreenCustomRes.height || 1080;
        }

        // 2. STRICT ORIENTATION ENFORCEMENT
        // Regardless of what was entered or selected in Custom, we force the dimensions
        // to match the selected Orientation toggle.
        
        if (newScreenOrientation === 'landscape') {
            // Landscape: Width MUST be greater than Height
            if (height > width) {
                const temp = width;
                width = height;
                height = temp;
            }
        } else {
            // Portrait: Height MUST be greater than Width
            if (width > height) {
                const temp = width;
                width = height;
                height = temp;
            }
        }

        try {
            const newDesign = await createWelcomeDesign({
                eventId: selectedEventId,
                partnerId: event.partnerId,
                name: newScreenName || `New ${newScreenOrientation} Screen`,
                background: '#ffffff',
                idleGallery: [],
                elements: [],
                orientation: newScreenOrientation,
                resolution: { width, height }
            });
            setIsCreateModalOpen(false);
            navigate(`/screen-builder/${newDesign.id}`);
        } catch (error) {
            console.error(error);
            alert("Failed to create screen design");
        }
    };

    const handleDeleteDesign = async (id: string) => {
        if (window.confirm("Are you sure? This action cannot be undone.")) {
            await deleteWelcomeDesign(id);
            setDesigns(prev => prev.filter(d => d.id !== id));
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Loading events...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome Screens Designer</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Design visual experiences for event displays.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
                {/* Event List */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-700 dark:text-white text-sm uppercase tracking-wide">Select Event</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {events.length === 0 && <div className="p-4 text-center text-slate-400 text-sm">No events found.</div>}
                        {events.map(event => (
                            <div 
                                key={event.id}
                                onClick={() => setSelectedEventId(event.id)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedEventId === event.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold ${selectedEventId === event.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-white'}`}>{event.name}</h4>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Calendar size={12} /> {event.date}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Designs & Actions */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                    {selectedEventId ? (
                        <>
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Screens & Displays</h3>
                                    <p className="text-xs text-slate-500">Configure screens for this event.</p>
                                </div>
                                <button onClick={handleOpenCreateModal} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md">
                                    <Plus size={18} /> Add Screen
                                </button>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {designs.length === 0 && <p className="col-span-full text-center text-slate-400 py-10">No screens configured yet.</p>}
                                    {designs.map(design => (
                                        <div key={design.id} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg transition-all relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className={`p-2 rounded-lg ${design.orientation === 'landscape' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'}`}>
                                                    {design.orientation === 'landscape' ? <Monitor size={24} /> : <Smartphone size={24} />}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => navigate(`/screen-builder/${design.id}`)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded" title="Edit Design"><Edit2 size={16}/></button>
                                                    <button onClick={() => handleDeleteDesign(design.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Delete"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{design.name}</h4>
                                            
                                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                                <span className="capitalize">{design.orientation}</span>
                                                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">{design.resolution.width}x{design.resolution.height}</span>
                                            </div>
                                            
                                            <button onClick={() => navigate(`/screen-builder/${design.id}`)} className="w-full mt-2 text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                                                <MonitorCheck size={14}/> Open Builder
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <Tv size={48} className="opacity-20 mb-4"/>
                            <p>Select an event to manage screens.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Creation Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-entry-pop-in">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">New Screen Setup</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Screen Name</label>
                                <div className="relative">
                                    <input 
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" 
                                        placeholder="e.g. Main Hall Totem" 
                                        value={newScreenName} 
                                        onChange={e => setNewScreenName(e.target.value)} 
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleGenerateNameClick}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                        title="Auto-generate Name"
                                    >
                                        <Sparkles size={16} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Orientation</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div 
                                        onClick={() => setNewScreenOrientation('landscape')}
                                        className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${newScreenOrientation === 'landscape' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                    >
                                        <Monitor size={32} className={newScreenOrientation === 'landscape' ? 'text-indigo-600' : 'text-slate-400'}/>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Landscape (Horizontal)</span>
                                    </div>
                                    <div 
                                        onClick={() => setNewScreenOrientation('portrait')}
                                        className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${newScreenOrientation === 'portrait' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                    >
                                        <Smartphone size={32} className={newScreenOrientation === 'portrait' ? 'text-indigo-600' : 'text-slate-400'}/>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Portrait (Vertical)</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Resolution</label>
                                <div className="flex gap-2 mb-2">
                                    {['HD', '4K', 'Custom'].map((res) => (
                                        <button 
                                            key={res} 
                                            onClick={() => setNewScreenResType(res as any)}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${newScreenResType === res ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                                {newScreenResType === 'Custom' && (
                                    <div className="grid grid-cols-2 gap-3 mt-2 animate-fade-in">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Width (px)</label>
                                            <input type="number" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm" value={newScreenCustomRes.width} onChange={e => setNewScreenCustomRes({...newScreenCustomRes, width: parseInt(e.target.value) || 0})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 block mb-1">Height (px)</label>
                                            <input type="number" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm" value={newScreenCustomRes.height} onChange={e => setNewScreenCustomRes({...newScreenCustomRes, height: parseInt(e.target.value) || 0})} />
                                        </div>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-400 mt-2">
                                    {newScreenResType === 'HD' && (newScreenOrientation === 'landscape' ? '1920 x 1080' : '1080 x 1920')}
                                    {newScreenResType === '4K' && (newScreenOrientation === 'landscape' ? '3840 x 2160' : '2160 x 3840')}
                                    {newScreenResType === 'Custom' && (
                                        // Show expected result based on current values and orientation enforcement
                                        newScreenOrientation === 'landscape' 
                                            ? `${Math.max(newScreenCustomRes.width, newScreenCustomRes.height)} x ${Math.min(newScreenCustomRes.width, newScreenCustomRes.height)} (Auto-Adjusted)`
                                            : `${Math.min(newScreenCustomRes.width, newScreenCustomRes.height)} x ${Math.max(newScreenCustomRes.width, newScreenCustomRes.height)} (Auto-Adjusted)`
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all">Cancel</button>
                            <button onClick={handleCreateDesign} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2">
                                <Check size={18} /> Create Screen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScreenManager;
