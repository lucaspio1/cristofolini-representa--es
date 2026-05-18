import React, { useState, useEffect } from 'react';
import { Shield, Plus, Power, PowerOff, Check, KeySquare } from 'lucide-react';

export const Users = ({ currentUser }: { currentUser: any }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', role: 'USER' });
  const [tempPasswordModal, setTempPasswordModal] = useState<{name: string, pass: string} | null>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const data = await res.json();
        setIsAdding(false);
        setFormData({ name: '', username: '', role: 'USER' });
        loadUsers();
        // Mostra a senha gerada na tela
        setTempPasswordModal({ name: formData.name, pass: data.tempPassword });
      } else { alert('Erro ao criar usuário.'); }
    } catch (err) { console.error(err); }
  };

  const handleResetPassword = async (userId: number, name: string) => {
    if (!confirm(`Deseja resetar a senha de ${name}? Uma nova senha provisória será gerada.`)) return;
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTempPasswordModal({ name, pass: data.tempPassword });
      }
    } catch (err) { console.error(err); }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    if (userId === currentUser.id) return alert('Você não pode desativar seu próprio usuário!');
    try {
      const res = await fetch(`/api/users/${userId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (res.ok) loadUsers();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8 relative">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-black flex items-center gap-2 dark:text-white"><Shield className="text-indigo-600" /> Controle de Acessos</h2>
          <button onClick={() => setIsAdding(!isAdding)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreateUser} className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Nome</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none dark:bg-zinc-800 dark:text-white dark:border-zinc-700" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-zinc-500 uppercase">Login</label><input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none dark:bg-zinc-800 dark:text-white dark:border-zinc-700" /></div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Nível</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 rounded-xl border outline-none dark:bg-zinc-800 dark:text-white dark:border-zinc-700">
                <option value="USER">Usuário Padrão</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl flex justify-center items-center gap-2"><Check className="w-4 h-4" /> Gerar Usuário</button>
          </form>
        )}

        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800">
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Nome / Login</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Nível de Acesso</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="p-4"><div className="font-bold dark:text-white">{user.name}</div><div className="text-xs text-zinc-500">@{user.username}</div></td>
                <td className="p-4"><span className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>{user.role}</span></td>
                <td className="p-4"><span className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${user.active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{user.active ? 'ATIVO' : 'DESATIVADO'}</span></td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => handleResetPassword(user.id, user.name)} className="p-2 rounded-xl transition-colors bg-amber-50 text-amber-600 hover:bg-amber-100" title="Resetar Senha"><KeySquare className="w-5 h-5" /></button>
                  <button onClick={() => handleToggleStatus(user.id, user.active)} disabled={user.id === currentUser.id} className={`p-2 rounded-xl transition-colors ${user.id === currentUser.id ? 'opacity-30 cursor-not-allowed' : user.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                    {user.active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal exibindo a senha Provisória */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-zinc-200 dark:border-zinc-700">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8" /></div>
            <h3 className="text-xl font-black mb-2 dark:text-white">Operação Concluída!</h3>
            <p className="text-sm text-zinc-500 mb-6">Abaixo está a senha provisória de <strong>{tempPasswordModal.name}</strong>. Peça para o usuário alterá-la no primeiro acesso.</p>
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl text-2xl font-mono font-bold text-zinc-900 dark:text-white tracking-widest select-all mb-6">
              {tempPasswordModal.pass}
            </div>
            <button onClick={() => setTempPasswordModal(null)} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Ciente, Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};