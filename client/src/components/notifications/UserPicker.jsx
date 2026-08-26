import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import userService from '../../services/userService';
import SearchInput from '../common/SearchInput';

export default function UserPicker({ selectedIds, onChange, multi = true }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      userService.listUsers({ search, limit: 8 }).then((r) => setResults(r.users));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const addUser = (user) => {
    const nextIds = multi ? [...new Set([...selectedIds, user.id])] : [user.id];
    const nextUsers = multi ? [...selectedUsers.filter((u) => u.id !== user.id), user] : [user];
    setSelectedUsers(nextUsers);
    onChange(nextIds);
    setSearch('');
    setResults([]);
  };

  const removeUser = (id) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
    onChange(selectedIds.filter((i) => i !== id));
  };

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search users by name or phone…" />
      {results.length > 0 && (
        <div className="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-card">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => addUser(user)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-muted"
            >
              <span className="font-medium text-slate-950">{user.fullName}</span>
              <span className="text-xs text-slate-500">{user.phone}</span>
            </button>
          ))}
        </div>
      )}
      {selectedUsers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedUsers.map((user) => (
            <span key={user.id} className="flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs text-slate-950">
              {user.fullName}
              <button type="button" onClick={() => removeUser(user.id)} className="text-slate-400 hover:text-rose">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
