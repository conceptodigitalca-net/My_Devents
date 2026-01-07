import React, { useState, useEffect } from 'react';
import { User, Event, GuestGroup } from '../types';
import { getEvents, getGuestGroups } from '../services/mockBackend';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface GuestEventSelectorProps {
    user: User;
}

const GuestEventSelector: React.FC<GuestEventSelectorProps> = ({ user }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [stats, setStats] = useState<Record<string, { total: number; confirmed: number }>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            // 1. Get Events
            const partnerIds = user.role === 'SUPER_ADMIN' ? undefined : user.partnerIds;
            const fetchedEvents = await getEvents(partnerIds);
            setEvents(fetchedEvents);

            // 2. Calculate Stats for each event
            const newStats: Record<string, { total: number; confirmed: number }> = {};
            
            await Promise.all(fetchedEvents.map(async (event) => {
                const groups = await getGuestGroups(event.id);
                let totalGuests = 0;
                let confirmedGuests = 0;

                groups.forEach(group => {
                    totalGuests += group.maxGuests;
                    confirmedGuests += group.guests.filter(g => g.isConfirmed).length;
                });

                newStats[event.id] = { total: totalGuests, confirmed: confirmedGuests };
            }));

            setStats(newStats);
            setLoading(false);
        };

        loadData();
    }, [user]);

    if (loading) {
        return <div className="p-8 text-center text-slate-400">Loading events...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Guest Lists</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Select an event to manage its invitations and RSVPs.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Users size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No events found</h3>
                        <p className="text-slate-500 text-sm mt-1">Create an event first to manage guests.</p>
                        <button onClick={() => navigate('/events')} className="mt-4 text-indigo-600 font-medium hover:underline">Go to Events</button>
                    </div>
                )}

                {events.map(event => {
                    const eventStats = stats[event.id] || { total: 0, confirmed: 0 };
                    const progress = eventStats.total > 0 ? (eventStats.confirmed / eventStats.total) * 100 : 0;

                    return (
                        <div 
                            key={event.id}
                            onClick={() => navigate(`/events/${event.id}/guests`)}
                            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={20} className="text-indigo-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                            </div>

                            <div className="mb-6">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full mb-2 inline-block">
                                    {event.type}
                                </span>
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{event.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <Calendar size={14} /> {event.date}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Guest Status</p>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                                                <Users size={14} className="text-indigo-500" /> {eventStats.total} <span className="text-xs font-normal text-slate-400">Total</span>
                                            </span>
                                            <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 size={14} /> {eventStats.confirmed} <span className="text-xs font-normal text-slate-400">Confirmed</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-slate-800 dark:text-white">{Math.round(progress)}%</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GuestEventSelector;