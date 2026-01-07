import React, { useState, useEffect } from 'react';
import { Partner } from '../types';
import { getPartners, createPartner } from '../services/mockBackend';
import { Plus, Search, Building2, MapPin, Mail, Phone, BarChart3, MoreVertical, ShieldCheck, X, Save, Check } from 'lucide-react';

const ManagePartners: React.FC = () => {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [eventLimit, setEventLimit] = useState(5);
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        getPartners().then(setPartners);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newPartner = await createPartner({
                name,
                contactEmail: email,
                phone,
                address,
                eventLimit,
                logo: logoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                status: 'active'
            });
            setPartners([...partners, newPartner]);
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            alert("Failed to create partner");
        }
    };

    const resetForm = () => {
        setName(''); setEmail(''); setPhone(''); setAddress(''); setEventLimit(5); setLogoUrl('');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Partner Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Create partners and assign event limits.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md font-medium">
                    <Plus size={20} /> Add Partner
                </button>
            </div>

            {/* Partner List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Partner</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Event Usage</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {partners.map((partner) => {
                                const usagePercent = (partner.eventsCreated / partner.eventLimit) * 100;
                                return (
                                    <tr key={partner.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={partner.logo} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-200" />
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-white">{partner.name}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10} /> {partner.address}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2"><Mail size={12} /> {partner.contactEmail}</div>
                                                <div className="flex items-center gap-2"><Phone size={12} /> {partner.phone}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 w-48">
                                            <div className="flex justify-between text-xs mb-1 font-medium">
                                                <span>{partner.eventsCreated} / {partner.eventLimit} Events</span>
                                                <span className={usagePercent > 90 ? 'text-red-500' : 'text-indigo-500'}>{Math.round(usagePercent)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-full rounded-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${usagePercent}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${partner.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {partner.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-indigo-600 p-2"><MoreVertical size={16} /></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                 </div>
            </div>

            {/* Create Partner Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-entry-pop-in">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Register New Partner</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                        </div>
                        <div className="p-6">
                            <form id="create-partner-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Company Name</label>
                                    <input required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email</label>
                                        <input required type="email" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" value={email} onChange={e => setEmail(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Phone</label>
                                        <input required type="tel" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" value={phone} onChange={e => setPhone(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Address</label>
                                    <input required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" value={address} onChange={e => setAddress(e.target.value)} />
                                </div>
                                
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Assigned Event Limit</label>
                                     <div className="flex items-center gap-4">
                                         <input type="range" min="1" max="100" value={eventLimit} onChange={e => setEventLimit(parseInt(e.target.value))} className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700" />
                                         <span className="font-bold text-indigo-600 text-lg w-10 text-center">{eventLimit}</span>
                                     </div>
                                     <p className="text-[10px] text-slate-400 mt-1">Maximum number of events this partner can create.</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Logo URL (Optional)</label>
                                    <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all">Cancel</button>
                            <button form="create-partner-form" type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2"><Save size={18} /> Register</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePartners;