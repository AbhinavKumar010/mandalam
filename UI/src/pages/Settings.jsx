import React, { useEffect, useState } from 'react';
import './Settings.css';
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
    <div className="settings-page">
      <MobileHeader />
      <div className="settings-page__layout">
        <Sidebar />
        <main className="settings-page__content">
          <Link to="/profile" className="settings-page__back">
            <ArrowLeft size={17} /> Profile
          </Link>
          <h1 className="settings-page__title">Settings</h1>
          <div className="settings-page__grid">
            <nav aria-label="Settings sections" className="settings-page__nav">
              {sections.map(({ key, label, icon: Icon }) => (
                <button key={key} type="button" onClick={() => setSearchParams({ section: key })} className={`settings-page__nav-item ${section.key === key ? 'settings-page__nav-item--active' : ''}`}>
                  <Icon size={17} /> {label}
                </button>
              ))}
              <Link to="/notifications?type=comment" className="settings-page__nav-item">Comments</Link>
              <Link to="/notifications?type=like" className="settings-page__nav-item"><Heart size={17} /> Likes</Link>
            </nav>

            <section className="settings-page__section">
              <h2 className="settings-page__section-title">{section.label}</h2>
              {section.key === 'privacy' ? (
                <div className="settings-page__privacy-row">
                  <div>
                    <p className="settings-page__privacy-label">Private account</p>
                    <p className="settings-page__description">Only approved followers can see your posts and stories.</p>
                  </div>
                  <button type="button" role="switch" aria-checked={settings.isPrivate} onClick={updatePrivacy} disabled={saving || loading} className={`settings-page__switch ${settings.isPrivate ? 'settings-page__switch--on' : ''}`}>
                    <span className="settings-page__switch-thumb" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="settings-page__helper">Manage accounts in your {section.label.toLowerCase()} list.</p>
                  {!loading && selectedPeople.length === 0 && <p className="settings-page__empty-row">No accounts in this list.</p>}
                  {selectedPeople.map((person) => (
                    <div key={person._id} className="settings-page__person-row">
                      <Avatar src={person.profilePic} name={person.username} className="settings-page__person-avatar" />
                      <span className="settings-page__person-name">{person.username}</span>
                      <button type="button" disabled={saving} onClick={() => updateList(person._id, 'remove')} className="settings-page__remove">Remove</button>
                    </div>
                  ))}
                  <div className="settings-page__search">
                    <Search size={15} className="settings-page__search-icon" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an account" className="settings-page__search-input" />
                  </div>
                  {!loading && availablePeople.length === 0 && <p className="settings-page__state">No accounts available.</p>}
                  {availablePeople.slice(0, 20).map((person) => (
                    <button key={person._id} type="button" disabled={saving} onClick={() => updateList(person._id, 'add')} className="settings-page__person-button">
                      <Avatar src={person.profilePic} name={person.username} alt={person.username} className="settings-page__person-avatar" />
                      <span className="settings-page__person-details">
                        <span className="settings-page__person-name">{person.username}</span>
                        {person.fullName && <span className="settings-page__person-full-name">{person.fullName}</span>}
                      </span>
                      <span className="settings-page__person-action">Add</span>
                    </button>
                  ))}
                </>
              )}
              {loading && <p className="settings-page__state">Loading settings...</p>}
              {error && <p role="alert" className="settings-page__state settings-page__state--error">{error}</p>}
            </section>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}