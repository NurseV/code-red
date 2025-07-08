
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import CalendarComponent from '../components/ui/Calendar';
import * as api from '../services/api';
import { Event, EventCategory, Role, Shift } from '../types';
import Button from '../components/ui/Button';
import { useInternalAuth } from '../hooks/useInternalAuth';
import Modal from '../components/ui/Modal';
import { PlusIcon, ChevronDownIcon } from '../components/icons/Icons';

const categoryColors: Record<EventCategory, string> = {
    [EventCategory.TRAINING]: 'bg-blue-500',
    [EventCategory.MAINTENANCE]: 'bg-yellow-500',
    [EventCategory.PUBLIC_EVENT]: 'bg-green-500',
    [EventCategory.MANUAL]: 'bg-purple-500',
    [EventCategory.SHIFT]: 'bg-gray-500',
};

const initialFilters: Record<EventCategory, boolean> = {
    [EventCategory.TRAINING]: true,
    [EventCategory.MAINTENANCE]: true,
    [EventCategory.PUBLIC_EVENT]: true,
    [EventCategory.MANUAL]: true,
    [EventCategory.SHIFT]: true,
};


const Calendar: React.FC = () => {
    const { user } = useInternalAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<Record<EventCategory, boolean>>(initialFilters);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', category: EventCategory.MANUAL, description: '' });
    
    const fetchEvents = () => {
        setIsLoading(true);
        Promise.all([
            api.getEvents(),
            api.getShifts()
        ]).then(([eventsData, shiftsData]) => {
            const shiftEvents: Event[] = shiftsData.map((shift: Shift) => ({
                id: `shift-event-${shift.id}`,
                title: `${shift.personnelName} (${shift.shiftType})`,
                date: shift.date,
                category: EventCategory.SHIFT,
                description: `${shift.personnelName} is scheduled for ${shift.shiftType}.`
            }));
            setEvents([...eventsData, ...shiftEvents]);
        }).finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const handleToggleFilter = (category: EventCategory) => {
        setFilters(prev => ({ ...prev, [category]: !prev[category] }));
    };
    
    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        const newEventToAdd: Omit<Event, 'id'> = {
            title: newEvent.title,
            date: new Date(newEvent.date).toISOString(),
            category: newEvent.category,
            description: newEvent.description,
        };
        try {
            await api.createEvent(newEventToAdd);
            setIsModalOpen(false);
            setNewEvent({ title: '', date: '', category: EventCategory.MANUAL, description: '' });
            fetchEvents();
        } catch(e) {
            alert('Failed to add event');
        }
    };

    const filteredEvents = useMemo(() => {
        return events.filter(event => filters[event.category]);
    }, [events, filters]);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <Card title="Event Filters">
                        <div className="space-y-3">
                            {Object.values(EventCategory).map(category => (
                                <label key={category} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters[category]}
                                        onChange={() => handleToggleFilter(category)}
                                        className={`h-4 w-4 rounded border-gray-500 focus:ring-transparent ${categoryColors[category]}`}
                                    />
                                    <span className="text-dark-text">{category}</span>
                                </label>
                            ))}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-3">
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-dark-border"><ChevronDownIcon className="h-6 w-6 transform -rotate-90" /></button>
                                <h2 className="text-xl font-bold text-dark-text mx-4 w-48 text-center">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h2>
                                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-dark-border"><ChevronDownIcon className="h-6 w-6 transform rotate-90" /></button>
                            </div>
                            {user && [Role.CHIEF, Role.ADMINISTRATOR].includes(user.role) && (
                                <Button onClick={() => setIsModalOpen(true)} icon={<PlusIcon className="h-4 w-4 mr-2"/>}>
                                    Add Event
                                </Button>
                            )}
                        </div>
                        {isLoading ? <div className="text-center p-8 text-dark-text-secondary">Loading calendar...</div> :
                            <CalendarComponent currentDate={currentDate} events={filteredEvents} categoryColors={categoryColors} />
                        }
                    </Card>
                </div>
            </div>
            <Modal title="Add New Calendar Event" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleAddEvent} className="space-y-4">
                     <div>
                        <label htmlFor="title" className="block text-sm font-medium text-dark-text-secondary mb-1">Event Title</label>
                        <input id="title" type="text" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="date" className="block text-sm font-medium text-dark-text-secondary mb-1">Date</label>
                        <input id="date" type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-dark-text-secondary mb-1">Category</label>
                        <select id="category" value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value as EventCategory})} required className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm">
                            {Object.values(EventCategory).filter(cat => cat !== EventCategory.SHIFT).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-dark-text-secondary mb-1">Description (Optional)</label>
                        <textarea id="description" rows={3} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="block w-full bg-dark-bg border border-dark-border rounded-md shadow-sm py-2 px-3 text-dark-text focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm" />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Add Event</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default Calendar;
