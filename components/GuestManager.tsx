import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Event, GuestGroup, Guest, Invitation } from '../types';
import { getEvent, getGuestGroups, createGuestGroup, updateGuestGroup, deleteGuestGroup, getInvitations } from '../services/mockBackend';
import { ArrowLeft, Plus, Users, Search, User, Mail, Phone, Trash2, Edit2, Check, X, ChevronDown, ChevronUp, UserPlus, Link2, AlertCircle } from 'lucide-react';

const GuestManager: React.FC = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [groups, setGroups] = useState<GuestGroup[]>([]);
    const [availableInvitations, setAvailableInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GuestGroup | null>(null);

    // Form State
    const [formalAddressee, setFormalAddressee] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [selectedInvitationId, setSelectedInvitationId] = useState('');
    const [guestsList, setGuestsList] = useState<Partial<Guest>[]>([]);

    useEffect(() => {
        if (eventId) {
            Promise.all([
                getEvent(eventId),
                getGuestGroups(eventId),
                getInvitations(undefined, eventId)
            ]).then(([ev, grps, invs]) => {
                if (ev) setEvent(ev);
                setGroups(grps);
                setAvailableInvitations(invs);
                setLoading(false);
            });
        }
    }, [eventId]);

    const openModal = (group?: GuestGroup) => {
        if (group) {
            setEditingGroup(group);
            setFormalAddressee(group.formalAddressee);
            setContactEmail(group.contactEmail || '');
            setContactPhone(group.contactPhone || '');
            setSelectedInvitationId(group.assignedInvitationId || '');
            setGuestsList([...group.guests]); 
        } else {
            setEditingGroup(null);
            setFormalAddressee('');
            setContactEmail('');
            setContactPhone('');
            
            // LOGIC: Auto-select invitation if only 1 exists
            if (availableInvitations.length === 1) {
                setSelectedInvitationId(availableInvitations[0].id);
            } else {
                setSelectedInvitationId('');
            }

            // Start with one primary guest slot
            setGuestsList([{ id: Date.now().toString(), name: '', role: 'Primary', isConfirmed: false }]);
        }
        setIsModalOpen(true);
    };

    // Simply update state while typing
    const handleEnvelopeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormalAddressee(e.target.value);
    };

    // --- SMART EXTRACTION LOGIC (On Blur) ---
    // Executed when the user finishes typing and leaves the field
    const handleEnvelopeBlur = () => {
        if (!formalAddressee.trim() || guestsList.length === 0) return;

        let subjectName = formalAddressee;

        // 1. Remove Honorifics/Prefixes at the start (Case insensitive)
        // Handles: Sr., Sr, Sra., Sra, Srita., Mr., Dr., etc. followed by a space
        const prefixRegex = /^(Sr\.|Sr|Sra\.|Sra|Srita\.|Srita|Dr\.|Dr|Lic\.|Lic|Ing\.|Ing|Arq\.|Arq|Mr\.|Mr|Mrs\.|Mrs|Ms\.|Ms)\s+/i;
        subjectName = subjectName.replace(prefixRegex, '');

        // 2. Split by Connectors to isolate the subject
        // Looks for " y ", " e ", " & ", " and " with spaces around them.
        // Example: "Dolores Noguera e Hija" -> splits into ["Dolores Noguera", "Hija"]
        // We take the first part [0]
        const connectorRegex = /\s+(y|e|&|and)\s+/i;
        const parts = subjectName.split(connectorRegex);
        
        if (parts.length > 0) {
            subjectName = parts[0];
        }

        // 3. Update the Primary Guest Name
        const updatedList = [...guestsList];
        // Only update if the current name is empty OR we assume the user wants auto-sync
        updatedList[0] = { ...updatedList[0], name: subjectName.trim() };
        setGuestsList(updatedList);
    };

    const handleAddGuestRow = () => {
        setGuestsList([...guestsList, { id: Date.now().toString(), name: '', role: 'Other', isConfirmed: false }]);
    };

    const handleGuestChange = (index: number, field: keyof Guest, value: any) => {
        const newList = [...guestsList];
        newList[index] = { ...newList[index], [field]: value };
        setGuestsList(newList);
    };

    const handleRemoveGuestRow = (index: number) => {
        if (guestsList.length > 1) {
            setGuestsList(guestsList.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId) return;

        // Filter out empty names
        const validGuests = guestsList.filter(g => g.name && g.name.trim() !== '') as Guest[];
        if (validGuests.length === 0) {
            alert("Please add at least one guest name.");
            return;
        }

        const groupData = {
            formalAddressee,
            contactEmail,
            contactPhone,
            guests: validGuests,
            maxGuests: validGuests.length, 
            status: editingGroup ? editingGroup.status : 'pending' as const,
            assignedInvitationId: selectedInvitationId || undefined
        };

        try {
            if (editingGroup) {
                const updated = await updateGuestGroup(editingGroup.id, groupData);
                setGroups(groups.map(g => g.id === updated.id ? updated : g));
            } else {
                const created = await createGuestGroup({
                    eventId,
                    ...groupData
                });
                setGroups([...groups, created]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to save guest group.");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Delete this guest group and all its guests?")) {
            await deleteGuestGroup(id);
            setGroups(groups.filter(g => g.id !== id));
        }
    };

    // Derived Stats
    const totalGuests = groups.reduce((acc, g) => acc + g.maxGuests, 0);
    const confirmedGuests = groups.reduce((acc, g) => acc + g.guests.filter(p => p.isConfirmed).length, 0);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading guest list...</div>;
    if (!event) return <div className="p-8 text-center text-red-500">Event not found.</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/guests')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Guest List</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Managing guests for <span className="font-semibold text-indigo-600 dark:text-indigo-400">{event.name}</span></p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                         <div className="text-right">
                             <p className="text-[10px] text-slate-400 uppercase font-bold">Total Invited</p>
                             <p className="text-xl font-bold text-slate-800 dark:text-white leading-none">{totalGuests}</p>
                         </div>
                         <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                         <div className="text-right">
                             <p className="text-[10px] text-slate-400 uppercase font-bold">Confirmed</p>
                             <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{confirmedGuests}</p>
                         </div>
                    </div>
                    <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md font-medium">
                        <UserPlus size={20} /> Add Invitation
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px]">
                {groups.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-20">
                        <Users size={48} className="mb-4 opacity-20" />
                        <p>No guests added yet.</p>
                        <button onClick={() => openModal()} className="mt-4 text-indigo-600 font-medium hover:underline">Add your first guest</button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {groups.map((group) => (
                            <GuestGroupCard 
                                key={group.id} 
                                group={group} 
                                invitations={availableInvitations}
                                onEdit={() => openModal(group)} 
                                onDelete={() => handleDelete(group.id)} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col animate-entry-pop-in">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{editingGroup ? 'Edit Invitation' : 'New Invitation'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <form id="guest-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Section 1: The Envelope */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Mail size={14}/> Envelope Details</h4>
                                    <div className="space-y-3">
                                        {/* Invitation Selection Logic */}
                                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block flex items-center gap-1">
                                                <Link2 size={12}/> Linked Invitation
                                            </label>
                                            
                                            {availableInvitations.length === 0 ? (
                                                <div className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                                                    <AlertCircle size={14}/>
                                                    No invitations created for this event yet.
                                                </div>
                                            ) : availableInvitations.length === 1 ? (
                                                <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded text-sm border border-indigo-100 dark:border-indigo-800">
                                                    <Check size={14} />
                                                    Auto-linked to: <strong>{availableInvitations[0].name}</strong>
                                                </div>
                                            ) : (
                                                <select 
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                                    value={selectedInvitationId}
                                                    onChange={(e) => setSelectedInvitationId(e.target.value)}
                                                >
                                                    <option value="">-- Select Invitation to Send --</option>
                                                    {availableInvitations.map(inv => (
                                                        <option key={inv.id} value={inv.id}>{inv.name} ({inv.type})</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Formal Addressee (Shown on Invite)</label>
                                            <input 
                                                required 
                                                placeholder="e.g. Sr. Aristides Castro y Familia" 
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                                value={formalAddressee}
                                                onChange={handleEnvelopeChange}
                                                onBlur={handleEnvelopeBlur}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Contact Email (Optional)</label>
                                                <input 
                                                    type="email"
                                                    placeholder="head@family.com" 
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                                    value={contactEmail}
                                                    onChange={e => setContactEmail(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Contact Phone (Optional)</label>
                                                <input 
                                                    type="tel"
                                                    placeholder="+1 234..." 
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                                    value={contactPhone}
                                                    onChange={e => setContactPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Individual Guests */}
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Users size={14}/> Guest List ({guestsList.length})</h4>
                                        <button type="button" onClick={handleAddGuestRow} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Plus size={12}/> Add Person</button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {guestsList.map((guest, index) => (
                                            <div key={index} className="flex gap-2 items-center animate-fade-in">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 grid grid-cols-3 gap-2">
                                                    <div className="col-span-2">
                                                        <input 
                                                            placeholder="Full Name" 
                                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                                            value={guest.name}
                                                            onChange={e => handleGuestChange(index, 'name', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <select 
                                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                                            value={guest.role}
                                                            onChange={e => handleGuestChange(index, 'role', e.target.value)}
                                                        >
                                                            <option value="Primary">Primary</option>
                                                            <option value="Spouse">Spouse</option>
                                                            <option value="Child">Child</option>
                                                            <option value="Companion">Companion</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => handleRemoveGuestRow(index)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all">Cancel</button>
                            <button form="guest-form" type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2">
                                <Check size={18} /> Save Invitation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const GuestGroupCard: React.FC<{ group: GuestGroup, invitations: Invitation[], onEdit: () => void, onDelete: () => void }> = ({ group, invitations, onEdit, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const confirmedCount = group.guests.filter(g => g.isConfirmed).length;
    
    // Find assigned invitation name
    const linkedInvitation = invitations.find(i => i.id === group.assignedInvitationId);

    return (
        <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-4">
                     <button className={`p-1 rounded-full text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                         <ChevronDown size={20} />
                     </button>
                     <div>
                         <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                             {group.formalAddressee}
                             {linkedInvitation && (
                                <span className="text-[10px] font-normal bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800 flex items-center gap-1" title="Assigned Invitation">
                                    <Link2 size={8} /> {linkedInvitation.name}
                                </span>
                             )}
                             {!linkedInvitation && (
                                <span className="text-[10px] font-normal bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-800" title="No Invitation Linked">
                                    No Link
                                </span>
                             )}
                         </h4>
                         <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                             <span className="flex items-center gap-1"><Users size={12} /> {group.maxGuests} Seats</span>
                             {group.contactEmail && <span className="flex items-center gap-1"><Mail size={12} /> {group.contactEmail}</span>}
                         </div>
                     </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${group.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {group.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{confirmedCount} confirmed</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit2 size={16}/></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-400 hover:text-red-500 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                </div>
            </div>
            
            {/* Expanded Details - Individual Guests */}
            {isExpanded && (
                <div className="ml-12 mt-3 pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-2 animate-fade-in">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Internal Guest List</p>
                    {group.guests.map(guest => (
                        <div key={guest.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${guest.isConfirmed ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                <span className="text-slate-700 dark:text-slate-300">{guest.name}</span>
                                <span className="text-xs text-slate-400 italic">({guest.role})</span>
                            </div>
                            <span className="text-xs text-slate-500">{guest.isConfirmed ? 'Going' : 'Pending'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GuestManager;