"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Building2, Plus, Edit, UserPlus } from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";
import Modal from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { getRoleLabel } from "@/lib/permissions";
import type { Profile, Department, UserRole } from "@/lib/types";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "departments">("users");
  const [users, setUsers] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Add User form
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("requester");
  const [newUserDept, setNewUserDept] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");

  // User form
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("requester");
  const [userDept, setUserDept] = useState("");
  const [userPhone, setUserPhone] = useState("");

  // Dept form
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    const { data: deptsData } = await supabase
      .from("departments")
      .select("*")
      .order("name");

    setUsers(usersData ?? []);
    setDepartments(deptsData ?? []);
    setLoading(false);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: userName,
        role: userRole,
        department_id: userDept || null,
        phone: userPhone || null,
      })
      .eq("id", selectedUser.id);

    if (error) { toast.error("Failed to update user"); setSaving(false); return; }
    toast.success("User updated");
    setShowUserModal(false);
    setSelectedUser(null);
    loadData();
    setSaving(false);
  };

  const resetAddUserForm = () => {
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRole("requester");
    setNewUserDept("");
    setNewUserPhone("");
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      toast.error("Name, email, and password are required");
      return;
    }
    if (newUserPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newUserEmail,
      password: newUserPassword,
      options: {
        data: {
          full_name: newUserName,
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setSaving(false);
      return;
    }

    if (authData?.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: newUserEmail,
          full_name: newUserName,
          role: newUserRole,
          department_id: newUserDept || null,
          phone: newUserPhone || null,
          is_active: true,
        })
        .eq("id", authData.user.id);

      if (profileError) {
        toast.error("Failed to create user profile");
        setSaving(false);
        return;
      }
    }

    toast.success("User created successfully");
    setShowAddUserModal(false);
    resetAddUserForm();
    loadData();
    setSaving(false);
  };

  const handleCreateDept = async () => {
    if (!deptName.trim()) { toast.error("Department name is required"); return; }
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.from("departments").insert({
      name: deptName,
      description: deptDesc || null,
    });

    if (error) {
      if (error.code === "23505") toast.error("Department name already exists");
      else toast.error("Failed to create department");
      setSaving(false);
      return;
    }

    toast.success("Department created");
    setShowDeptModal(false);
    setDeptName("");
    setDeptDesc("");
    loadData();
    setSaving(false);
  };

  const openUserModal = (user: Profile) => {
    setSelectedUser(user);
    setUserName(user.full_name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserDept(user.department_id ?? "");
    setUserPhone(user.phone ?? "");
    setShowUserModal(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-96 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage users and system configuration</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-gray-50 p-1">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "users" ? "bg-surface text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
          }`}
        >
          <Users size={16} /> Users
        </button>
        <button
          onClick={() => setActiveTab("departments")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "departments" ? "bg-surface text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
          }`}
        >
          <Building2 size={16} /> Departments
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <p className="text-sm font-medium text-text-secondary">All users</p>
            <button onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
              <UserPlus size={16} /> Add User
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Joined</th>
                  <th className="px-4 py-3 text-left font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{user.full_name}</p>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.is_active ? "active" : "inactive"} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openUserModal(user)}
                        className="rounded-lg p-1.5 text-text-secondary hover:bg-gray-100 hover:text-foreground">
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === "departments" && (
        <div className="space-y-4">
          <button onClick={() => setShowDeptModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover">
            <Plus size={16} /> Add Department
          </button>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {departments.length === 0 ? (
              <div className="py-12 text-center text-sm text-text-secondary">
                No departments created yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50">
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">Name</th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">Description</th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-text-secondary">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {departments.map((dept) => (
                      <tr key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{dept.name}</td>
                        <td className="px-4 py-3 text-text-secondary">{dept.description ?? "—"}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={dept.is_active ? "active" : "inactive"} />
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{formatDate(dept.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <Modal open={showUserModal} title="Edit User" onClose={() => { setShowUserModal(false); setSelectedUser(null); }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input type="email" value={userEmail} disabled
              className="w-full rounded-lg border border-border bg-gray-50 px-3 py-2.5 text-sm text-text-secondary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
            <select value={userRole} onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="admin">Administrator</option>
              <option value="requester">Department Staff</option>
              <option value="approver">Approving Officer</option>
              <option value="procurement_officer">Procurement Officer</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Department</label>
            <select value={userDept} onChange={(e) => setUserDept(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="">No department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
            <input type="text" value={userPhone} onChange={(e) => setUserPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button onClick={() => { setShowUserModal(false); setSelectedUser(null); }}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">Cancel</button>
            <button onClick={handleUpdateUser} disabled={saving}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {saving ? "Saving..." : "Update User"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Department Modal */}
      <Modal open={showDeptModal} title="Add Department" onClose={() => setShowDeptModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Department Name *</label>
            <input type="text" value={deptName} onChange={(e) => setDeptName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="e.g. Finance, Operations" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
            <textarea value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
              placeholder="Brief description" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button onClick={() => setShowDeptModal(false)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreateDept} disabled={saving}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {saving ? "Creating..." : "Create Department"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal open={showAddUserModal} title="Add User" onClose={() => { setShowAddUserModal(false); resetAddUserForm(); }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="e.g. Jane Smith" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="jane@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
            <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="requester">Department Staff</option>
              <option value="approver">Approving Officer</option>
              <option value="procurement_officer">Procurement Officer</option>
              <option value="supplier">Supplier</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Department</label>
            <select value={newUserDept} onChange={(e) => setNewUserDept(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="">No department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Phone</label>
            <input type="text" value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button onClick={() => { setShowAddUserModal(false); resetAddUserForm(); }}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50">Cancel</button>
            <button onClick={handleAddUser} disabled={saving}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
              {saving ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
