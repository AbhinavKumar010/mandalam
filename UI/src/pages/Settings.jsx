import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, Shield, Users, UserRoundX, Heart, Star, VolumeX } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import BottomNav from '../components/BottomNav';
import Avatar from '../components/Avatar';
import API from '../api/axios';

const sections = [
  { key: 'privacy', label: 'Privacy', icon: Shield },
  { key: 'close-friends', label: 'Close friends', icon: Users, field: 'closeFriends' },
  { key: 'blocked', label: 'Blocked', icon: UserRoundX, field: 'blockedUsers' },
  { key: 'favorites', label: 'Favorites', icon: Star, field: 'favoriteUsers' },
  { key: 'muted', label: 'Muted', icon: VolumeX, field: 'mutedUsers' },
];

const emptySettings = {
  isPrivate: false,
  closeFriends: [],
  blockedUsers: [],
  favoriteUsers: [],
  mutedUsers: [],
};

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [settings, setSettings] = useState(emptySettings);
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const sectionKey = searchParams.get('section') || 'privacy';
  const section = sections.find((item) => item.key === sectionKey) || sections[0];

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settingsResponse, peopleResponse] = await Promise.all([
          API.get('/settings'),
          API.get('/settings/people'),
        ]);
        setSettings({ ...emptySettings, ...settingsResponse.data });
        setPeople(peopleResponse.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Could not load settings.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const selectedPeople = section.field ? settings[section.field] || [] : [];
  const selectedIds = new Set(selectedPeople.map((person) => person._id));
  const availablePeople = people.filter((person) =>
    !selectedIds.has(person._id) &&
    `${person.username} ${person.fullName || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  const updatePrivacy = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await API.patch('/settings', { field: 'isPrivate', value: !settings.isPrivate });
      setSettings({ ...emptySettings, ...data });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update privacy.');
    } finally {
      setSaving(false);
    }
  };

  const updateList = async (personId, action) => {
    if (!section.field) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await API.patch('/settings', { field: section.field, userId: personId, action });
      setSettings({ ...emptySettings, ...data });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update this list.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950 dark:bg-black dark:text-white">
      <MobileHeader />
      <div className="flex">
        <Sidebar />
        <main className="mx-auto w-full max-w-[920px] flex-1 px-4 py-5 pb-20 md:px-8 md:py-10">
          <Link to="/profile" className="mb-5 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
            <ArrowLeft size={17} /> Profile
          </Link>
          <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
          <div className="grid gap-7 md:grid-cols-[220px_minmax(0,1fr)]">
            <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto md:flex-col">
              {sections.map(({ key, label, icon: Icon }) => (
                <button key={key} type="button" onClick={() => setSearchParams({ section: key })} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${section.key === key ? 'bg-neutral-200 font-semibold dark:bg-neutral-800' : 'hover:bg-neutral-100 dark:hover:bg-neutral-900'}`}>
                  <Icon size={17} /> {label}
                </button>
              ))}
              <Link to="/notifications?type=comment" className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900">Comments</Link>
              <Link to="/notifications?type=like" className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"><Heart size={17} /> Likes</Link>
            </nav>

            <section className="min-w-0 border-t border-neutral-200 pt-5 dark:border-neutral-800 md:border-l md:border-t-0 md:pl-7 md:pt-0">
              <h2 className="mb-2 text-lg font-semibold">{section.label}</h2>
              {section.key === 'privacy' ? (
                <div className="flex items-center justify-between gap-4 border-b border-neutral-200 py-4 dark:border-neutral-800">
                  <div>
                    <p className="text-sm font-medium">Private account</p>
                    <p className="mt-1 text-xs text-neutral-500">Only approved followers can see your posts and stories.</p>
                  </div>
                  <button type="button" role="switch" aria-checked={settings.isPrivate} onClick={updatePrivacy} disabled={saving || loading} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settings.isPrivate ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${settings.isPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-xs text-neutral-500">Manage accounts in your {section.label.toLowerCase()} list.</p>
                  {!loading && selectedPeople.length === 0 && <p className="border-b border-neutral-200 py-4 text-sm text-neutral-500 dark:border-neutral-800">No accounts in this list.</p>}
                  {selectedPeople.map((person) => (
                    <div key={person._id} className="flex items-center gap-3 border-b border-neutral-200 py-3 dark:border-neutral-800">
                      <Avatar src={person.profilePic} name={person.username} className="h-9 w-9" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{person.username}</span>
                      <button type="button" disabled={saving} onClick={() => updateList(person._id, 'remove')} className="text-xs font-semibold text-blue-600 disabled:opacity-50">Remove</button>
                    </div>
                  ))}
                  <div className="relative my-4">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an account" className="w-full rounded-lg bg-neutral-100 py-2 pl-9 pr-3 text-sm outline-none dark:bg-neutral-900" />
                  </div>
                  {!loading && availablePeople.length === 0 && <p className="py-3 text-sm text-neutral-500">No accounts available.</p>}
                  {availablePeople.slice(0, 20).map((person) => (
                    <button key={person._id} type="button" disabled={saving} onClick={() => updateList(person._id, 'add')} className="flex w-full items-center gap-3 border-b border-neutral-200 py-3 text-left hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
                      <Avatar src={person.profilePic} name={person.username} alt={person.username} className="h-9 w-9" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{person.username}</span>
                        {person.fullName && <span className="truncate text-xs text-neutral-500">{person.fullName}</span>}
                      </span>
                      <span className="text-xs font-semibold text-blue-600">Add</span>
                    </button>
                  ))}
                </>
              )}
              {loading && <p className="py-6 text-sm text-neutral-500">Loading settings...</p>}
              {error && <p role="alert" className="mt-4 text-sm text-red-500">{error}</p>}
            </section>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}