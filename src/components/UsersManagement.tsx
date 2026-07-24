import { useState, useEffect } from "react";
import {
  Users, Plus, Search, RefreshCw, Edit2, ToggleLeft, ToggleRight,
  Mail, Phone, Clock, Shield, User, X, Save, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "../lib/authContext";
import {
  UserProfile, UserRole,
  listUserProfiles, updateUserProfile, createEmployeeAccount, logActivity,
} from "../lib/userService";

function formatDate(d?: string) {
  if (!d) return "Jamais";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Initials({ name }: { name: string }) {
  const init = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
      {init}
    </div>
  );
}

interface CreateModalProps {
  onClose: () => void;
  onCreated: () => void;
  actorProfile: UserProfile;
}

function CreateUserModal({ onClose, onCreated, actorProfile }: CreateModalProps) {
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "employee" as UserRole, phone: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createEmployeeAccount(form);
      logActivity({
        user_id: actorProfile.id,
        user_name: actorProfile.full_name,
        user_role: actorProfile.role,
        action: "create_user",
        entity_type: "user",
        description: `Création du compte ${form.email} (${form.role})`,
        new_values: { email: form.email, role: form.role, full_name: form.full_name },
      });
      onCreated();
    } catch (err: any) {
      setError(err.message ?? "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> Ajouter un utilisateur
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet</label>
            <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe</label>
            <div className="relative">
              <input required type={showPw ? "text" : "password"} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8}
                className="w-full pr-10 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone (facultatif)</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rôle</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
              <option value="employee">Employé</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditModalProps {
  user: UserProfile;
  onClose: () => void;
  onSaved: () => void;
  actorProfile: UserProfile;
  isSelf: boolean;
}

function EditUserModal({ user, onClose, onSaved, actorProfile, isSelf }: EditModalProps) {
  const [form, setForm] = useState({ full_name: user.full_name, role: user.role, phone: user.phone ?? "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const updates: Partial<UserProfile> = { full_name: form.full_name, phone: form.phone };
      if (!isSelf) updates.role = form.role;
      await updateUserProfile(user.id, updates);
      logActivity({
        user_id: actorProfile.id,
        user_name: actorProfile.full_name,
        user_role: actorProfile.role,
        action: "update_user",
        entity_type: "user",
        entity_id: user.id,
        description: `Modification du profil de ${user.full_name}`,
        old_values: { full_name: user.full_name, role: user.role },
        new_values: updates,
      });
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-blue-600" /> Modifier l&apos;utilisateur
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
          {!isSelf && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rôle</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
                <option value="employee">Employé</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UsersManagement() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filtered, setFiltered] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<UserProfile | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listUserProfiles();
      setUsers(data);
      setFiltered(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? users.filter((u) =>
      u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    ) : users);
  }, [search, users]);

  const handleToggleActive = async (user: UserProfile) => {
    if (!profile) return;
    if (user.id === profile.id) return; // can't disable self
    setToggling(user.id);
    try {
      await updateUserProfile(user.id, { active: !user.active });
      logActivity({
        user_id: profile.id,
        user_name: profile.full_name,
        user_role: profile.role,
        action: user.active ? "deactivate_user" : "activate_user",
        entity_type: "user",
        entity_id: user.id,
        description: `${user.active ? "Désactivation" : "Activation"} du compte de ${user.full_name}`,
      });
      await load();
    } finally {
      setToggling(null);
      setConfirmToggle(null);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" /> Utilisateurs
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} compte{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Actualiser
          </button>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par nom ou email…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Utilisateur</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rôle</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Dernière connexion</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => {
                const isSelf = u.id === profile.id;
                return (
                  <tr key={u.id} className={`hover:bg-gray-50/60 transition-colors ${!u.active ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Initials name={u.full_name} />
                        <div>
                          <div className="font-medium text-gray-900">{u.full_name} {isSelf && <span className="text-xs text-gray-400">(vous)</span>}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-gray-500">
                      {u.phone ? (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
                          <Shield className="w-3 h-3" /> Administrateur
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          <User className="w-3 h-3" /> Employé
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-gray-400 text-xs">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(u.last_login_at)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {u.active ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditUser(u)} title="Modifier"
                          className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => u.active ? setConfirmToggle(u) : handleToggleActive(u)}
                            disabled={toggling === u.id}
                            title={u.active ? "Désactiver" : "Activer"}
                            className={`p-1.5 rounded-md transition-colors ${u.active ? "text-gray-400 hover:text-red-600 hover:bg-red-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                          >
                            {toggling === u.id
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : u.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm deactivate */}
      {confirmToggle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Désactiver le compte ?</h3>
            <p className="text-sm text-gray-600">
              <strong>{confirmToggle.full_name}</strong> ne pourra plus se connecter à l&apos;administration.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmToggle(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">
                Annuler
              </button>
              <button onClick={() => handleToggleActive(confirmToggle)}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700">
                Désactiver
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
          actorProfile={profile}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); load(); }}
          actorProfile={profile}
          isSelf={editUser.id === profile.id}
        />
      )}
    </div>
  );
}
