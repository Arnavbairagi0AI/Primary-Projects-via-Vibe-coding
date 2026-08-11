import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { useActivityLog } from '../../hooks/useActivityLog';
import { 
  Users, 
  Plus, 
  Mail, 
  Shield, 
  Smartphone, 
  FolderLock, 
  Trash2, 
  X, 
  IdCard 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmployeeProfile, UserRole } from '../../types';

interface TeamSectionProps {
  employees: EmployeeProfile[];
  onAddEmployee: (employeeData: Omit<EmployeeProfile, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'status'>) => void;
  onDeleteEmployee: (employeeId: string) => void;
}

export default function TeamSection({ employees, onAddEmployee, onDeleteEmployee }: TeamSectionProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { logActivity } = useActivityLog();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Engineering');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      showToast("Please fill in required name and email.", "error");
      return;
    }

    onAddEmployee({
      companyId: user?.companyId || '',
      userId: 'user_' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      role,
      phone,
      department
    });

    logActivity('Invited Team Member', `Added ${name} to organization roster as ${role}`);
    showToast(`${name} has been added to organization!`, 'success');

    // Reset
    setName('');
    setEmail('');
    setPhone('');
    setRole('Employee');
    setDepartment('Engineering');
    setShowAddForm(false);
  };

  const handleDelete = (id: string, empName: string) => {
    if (confirm(`Are you sure you want to remove ${empName} from organization access?`)) {
      onDeleteEmployee(id);
      logActivity('Removed Team Member', `Revoked portal access for ${empName}`);
      showToast(`${empName} access revoked.`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Enterprise Organization Roster</h2>
          <p className="text-xs text-slate-400">Manage verified accounts, engineers, and tender managers with role-based dashboard access.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 active:scale-95 shadow-lg shadow-indigo-600/10 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Roster table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-5">Employee / Engineer</th>
                <th className="py-4 px-5">Department</th>
                <th className="py-4 px-5">Portal Role</th>
                <th className="py-4 px-5">Contact Details</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                    <Users className="w-8 h-8 opacity-20 mx-auto mb-2 text-slate-400" />
                    No employees enrolled in organization records.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  return (
                    <tr key={emp.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400">
                          {emp.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-200">{emp.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{emp.id.substring(0, 10)}</p>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-400 font-medium">
                        {emp.department || 'Management'}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          emp.role === 'Company Admin' || emp.role === 'Super Admin'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : emp.role === 'Tender Manager'
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : emp.role === 'Project Manager'
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}>
                          <Shield className="w-3 h-3" />
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-4 px-5 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-slate-600" />
                          <span>{emp.email}</span>
                        </div>
                        {emp.phone && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        {user?.role === 'Company Admin' && user.id !== emp.userId ? (
                          <button
                            onClick={() => handleDelete(emp.id, emp.name)}
                            className="p-2 bg-slate-950 border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/5 text-slate-500 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Dialog */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-x-4 top-10 md:top-20 md:max-w-lg md:mx-auto bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 z-50 overflow-y-auto max-h-[85vh] shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-extrabold text-white text-base">Enlist New Team Member</h3>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Staff Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aditi Sharma"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 text-slate-100 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Professional Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. aditi@firm.com"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 text-slate-100 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Role Designation</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none"
                    >
                      <option value="Employee">Employee / Engineer</option>
                      <option value="Tender Manager">Tender Manager</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Finance Manager">Finance Manager</option>
                      <option value="Company Admin">Company Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Tendering">Tendering</option>
                      <option value="Operations">Operations</option>
                      <option value="Finance">Finance</option>
                      <option value="Administration">Administration</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Contact Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9988776655"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 text-slate-100 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:scale-95 transition-all mt-4 cursor-pointer"
                >
                  Enlist & Issue Access
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
