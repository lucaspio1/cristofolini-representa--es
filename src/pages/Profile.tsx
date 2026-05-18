import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, KeyRound, Check } from 'lucide-react';

export const Profile = ({ currentUser, onPasswordChanged }: { currentUser: any, onPasswordChanged: () => void }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert('As senhas não coincidem!');
    if (newPassword.length < 6) return alert('A senha deve ter pelo menos 6 caracteres.');

    setIsLoading(true);
    try {
      const res = await fetch('/api/users/change-my-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ newPassword })
      });
      if (res.ok) {
        alert('Senha alterada com sucesso!');
        onPasswordChanged();
      } else { alert('Erro ao alterar senha'); }
    } catch (err) { alert('Erro de conexão'); }
    setIsLoading(false);
  };

  const isForced = currentUser.must_change_password;

  return (
    <div className="flex items-center justify-center p-4 min-h-[70vh]">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 max-w-md w-full p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        
        {isForced ? (
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4"><ShieldAlert className="w-8 h-8" /></div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Ação Obrigatória</h2>
            <p className="text-sm text-zinc-500 mt-2">Por motivos de segurança, você precisa alterar sua senha provisória antes de acessar o sistema.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4"><KeyRound className="w-8 h-8" /></div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Meu Perfil</h2>
            <p className="text-sm text-zinc-500 mt-2">Altere sua senha de acesso abaixo.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nova Senha</label>
            <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Confirmar Senha</label>
            <input required type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all" />
          </div>
          
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all">
            {isLoading ? 'Salvando...' : <><Check className="w-5 h-5" /> Confirmar Nova Senha</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
};