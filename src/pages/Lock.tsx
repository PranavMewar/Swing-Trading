import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Lock as LockIcon } from 'lucide-react';

export default function Lock() {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await api.verifyPassword(pwd);
    if (r.ok) nav('/', { replace: true });
    else setErr('Incorrect password');
  };

  return (
    <div className="h-screen flex items-center justify-center bg-bg">
      <form onSubmit={submit} className="card w-80 text-center space-y-4">
        <LockIcon className="mx-auto text-accent" size={32} />
        <div>
          <div className="text-lg font-semibold">Swing Journal</div>
          <div className="text-xs text-slate-500">Enter password to unlock</div>
        </div>
        <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="w-full" autoFocus />
        {err && <div className="text-rose-400 text-sm">{err}</div>}
        <button type="submit" className="btn-primary w-full justify-center">Unlock</button>
      </form>
    </div>
  );
}
