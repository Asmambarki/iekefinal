import { useState, useEffect } from "react";
import { User, Phone, Mail, Clock, Save, RefreshCw, Lock, History } from "lucide-react";
import { useAuth } from "../lib/authContext";
import { updateOwnProfile, changeOwnPassword, getActivityLogs, ActivityLog } from "../lib/userService";

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function MyProfile() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name, phone: profile.phone ?? "" });
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setLogsLoading(true);
    getActivityLogs(profile.id).then(setLogs).finally(() => setLogsLoading(false));
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await updateOwnProfile(profile.id, { full_name: form.full_name, phone: form.phone });
      await refreshProfile();
      setSaveMsg("Profil mis à jour.");
    } catch {
      setSaveMsg("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg("");
    if (pwForm.next !== pwForm.confirm) { setPwMsg("Les mots de passe ne correspondent pas."); return; }
    if (pwForm.next.length < 8) { setPwMsg("Le mot de passe doit contenir au moins 8 caractères."); return; }
    setPwSaving(true);
    try {
      await changeOwnPassword(pwForm.next);
      setPwForm({ current: "", next: "", confirm: "" });
      setPwMsg("Mot de passe modifié avec succès.");
    } catch (err: any) {
      setPwMsg(err.message ?? "Erreur lors du changement de mot de passe.");
    } finally {
      setPwSaving(false);
    }
  };

  if (!profile) return null;

  const roleLabel = profile.role === "admin" ? "Administrateur" : "Employé";
  const roleBadge = profile.role === "admin"
    ? "bg-blue-50 text-blue-700 ring-blue-200"
    : "bg-emerald-50 text-emerald-700 ring-emerald-200";

  return (
    <div className="max-w-2xl space-y-6">
      {/* Identity card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold">
            {profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-lg">{profile.full_name}</div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ring-1 ring-inset ${roleBadge}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {profile.email}</div>
          {profile.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {profile.phone}</div>}
          <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Dernière connexion : {formatDate(profile.last_login_at)}</div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><User className="w-4 h-4" /> Modifier mon profil</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet</label>
            <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone (facultatif)</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {saveMsg && (
            <p className={`text-sm px-3 py-2 rounded-xl border ${saveMsg.includes("Erreur") ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-700 border-green-100"}`}>
              {saveMsg}
            </p>
          )}
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60">
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Enregistrer
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Lock className="w-4 h-4" /> Changer mon mot de passe</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
            <input required type="password" minLength={8} value={pwForm.next}
              onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirmer le mot de passe</label>
            <input required type="password" value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {pwMsg && (
            <p className={`text-sm px-3 py-2 rounded-xl border ${pwMsg.includes("Erreur") || pwMsg.includes("correspond") || pwMsg.includes("caractère") ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-700 border-green-100"}`}>
              {pwMsg}
            </p>
          )}
          <button type="submit" disabled={pwSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-800 text-white rounded-xl hover:bg-gray-900 disabled:opacity-60">
            {pwSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            Mettre à jour
          </button>
        </form>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4"><History className="w-4 h-4" /> Mes actions récentes</h3>
        {logsLoading ? (
          <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune action enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                <div>
                  <p className="text-gray-800">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
