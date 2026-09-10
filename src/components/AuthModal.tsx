import React, { useState } from 'react';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Building,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { DEFAULT_USER } from '../utils/initialData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [role, setRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (isRegister && !name) {
      setError('Please enter your full name.');
      return;
    }

    let derivedName = name.trim();
    if (!derivedName) {
      if (email.toLowerCase().includes('varshakorabu')) {
        derivedName = 'Varsha Korabu';
      } else {
        const local = email.split('@')[0].replace(/[0-9_.-]+/g, ' ').trim();
        derivedName = local.replace(/\b\w/g, (c) => c.toUpperCase()) || 'Student';
      }
    }

    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      name: derivedName,
      email,
      role,
      department,
      semester: 'Semester 6',
      studentId: studentId || 'CS-2026-9901',
    };

    onLogin(user);
    onClose();
  };

  const handleQuickDemoLogin = () => {
    onLogin(DEFAULT_USER);
    onClose();
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="auth-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white p-6 relative">
          <button
            id="close-auth-btn"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 bg-blue-600/30 border border-blue-400/30 rounded-xl">
              <GraduationCap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {currentUser
                  ? 'Student Profile & Authentication'
                  : isRegister
                  ? 'Create Student Account'
                  : 'Welcome to LumiClass AI'}
              </h2>
              <p className="text-xs text-blue-200">
                {currentUser
                  ? 'Signed in as authenticated campus member'
                  : 'Log in to sync your intelligent timetables and alerts'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {currentUser ? (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-inner">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>

              <div>
                {isEditingName ? (
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Enter your full name"
                      className="text-sm font-bold text-slate-900 border border-indigo-300 rounded-lg px-2.5 py-1 text-center focus:ring-2 focus:ring-blue-500 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        if (editedName.trim()) {
                          onLogin({ ...currentUser, name: editedName.trim() });
                          setIsEditingName(false);
                        }
                      }}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-700 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="text-lg font-bold text-slate-900">{currentUser.name}</h3>
                    <button
                      onClick={() => {
                        setEditedName(currentUser.name);
                        setIsEditingName(true);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 underline font-medium"
                      title="Edit Display Name"
                    >
                      (Edit)
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
                <div className="flex justify-center gap-2 mt-2">
                  <span className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium border border-blue-200 uppercase tracking-wide">
                    {currentUser.role}
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                    {currentUser.studentId}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800">{currentUser.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Semester:</span>
                  <span className="font-semibold text-slate-800">{currentUser.semester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Notification Status:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active & Scheduled
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  id="auth-logout-btn"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors"
                >
                  Sign Out
                </button>
                <button
                  id="auth-continue-btn"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Continue to App
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quick Demo Login Pill */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Demo Student Login
                  </div>
                  <div className="text-[11px] text-blue-700">Alex Rivera (CS Sem 6)</div>
                </div>
                <button
                  id="demo-student-login-btn"
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  One-Click Demo
                </button>
              </div>

              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  id="tab-auth-login"
                  onClick={() => {
                    setIsRegister(false);
                    setError('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${
                    !isRegister
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="tab-auth-register"
                  onClick={() => {
                    setIsRegister(true);
                    setError('');
                  }}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors border-b-2 ${
                    isRegister
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {isRegister && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        id="auth-name-input"
                        type="text"
                        placeholder="e.g. Jordan Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={isRegister}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    University Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="auth-email-input"
                      type="email"
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="auth-password-input"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {isRegister && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Role
                      </label>
                      <select
                        id="auth-role-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'student' | 'faculty' | 'admin')}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Student / Staff ID
                      </label>
                      <input
                        id="auth-id-input"
                        type="text"
                        placeholder="CS-2026-XXXX"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                )}

                <button
                  id="auth-submit-btn"
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>{isRegister ? 'Register & Start Scheduling' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
