import React, { useState, useEffect } from 'react';
import { User, Event } from '../types';
import { getEvents } from '../services/mockBackend';
import { useNavigate } from 'react-router-dom';
import { Sofa, Calendar, ArrowRight, MapPin } from 'lucide-react';

interface SeatingEventSelectorProps {
    user: User;
}

const SeatingEventSelector: React.FC<SeatingEventSelectorProps> = ({ user }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const partnerIds = user.role === 'SUPER_ADMIN' ? undefined : user.partnerIds;
            const fetchedEvents = await getEvents(partnerIds);
            setEvents(fetchedEvents);
            setLoading(false);
        };
        loadData();
    }, [user]);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading events...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Assign Seats</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Select an event to assign confirmed guests to tables.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Sofa size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No events found</h3>
                        <p className="text-slate-500 text-sm mt-1">Create an event first to start seating guests.</p>
                        <button onClick={() => navigate('/events')} className="mt-4 text-indigo-600 font-medium hover:underline">Go to Events</button>
                    </div>
                )}

                {events.map(event => (
                    <div 
                        key={event.id}
                        onClick={() => navigate(`/seating-chart/${event.id}`)}
                        className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                    >
                         <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                             <ArrowRight size={20} className="text-indigo-500 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                         </div>

                         <div className="mb-4">
                             <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full mb-2 inline-block">
                                 {event.type}
                             </span>
                             <h3 className="font-bold text-slate-800 dark:text-white text-lg">{event.name}</h3>
                             <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                 <Calendar size={14} /> {event.date}
                             </div>
                         </div>

                         <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <Sofa size={14} />
                                <span>Assign guests to tables</span>
                            </div>
                         </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SeatingEventSelector;