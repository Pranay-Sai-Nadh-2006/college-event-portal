import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { getDbState, registerUser } from '../utils/db';
import { LogIn, UserPlus, Key, Eye, EyeOff, ShieldCheck, Mail, User as UserIcon, BookOpen, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  onLoginSuccess: (user: User) => void;
  onClose?: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export default function AuthModal({ onLoginSuccess, onClose, onToast }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Quick credentials fill
  const handleQuickFill = (fillRole: 'student' | 'admin') => {
    if (fillRole === 'student') {
      setEmail('student@college.edu');
      setPassword('student123');
      setRole('student');
    } else {
      setEmail('admin@college.edu');
      setPassword('admin123');
      setRole('admin');
    }
    setIsLogin(true);
    onToast('info', 'Credentials Filled', `${fillRole === 'student' ? 'Student' : 'Admin'} credentials auto-filled! Click Sign In.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      onToast('error', 'Fields Required', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const state = getDbState();
      const trimmedEmail = email.trim().toLowerCase();

      if (isLogin) {
        // Handle Login
        const user = state.users.find(u => u.email.toLowerCase() === trimmedEmail);
        
        if (!user) {
          onToast('error', 'Account Not Found', 'No account exists with this email address.');
          setIsLoading(false);
          return;
        }

        if (user.password !== password) {
          onToast('error', 'Authentication Failed', 'Incorrect password. Please try again.');
          setIsLoading(false);
          return;
        }

        // Successfully logged in
        onToast('success', 'Welcome Back!', `Logged in successfully as ${user.name}`);
        onLoginSuccess(user);
      } else {
        // Handle Signup
        if (!name) {
          onToast('error', 'Name Required', 'Please enter your full name');
          setIsLoading(false);
          return;
        }

        const registrationResult = registerUser({
          name,
          email: trimmedEmail,
          password,
          role: 'student', // Admin account creations are handled in backend or predefined
          department: department || 'General Science',
          studentId: studentId || `CS-2026-${Math.floor(100 + Math.random() * 900)}`,
          avatarColor: 'bg-blue-500'
        });

        if (!registrationResult.success || !registrationResult.user) {
          onToast('error', 'Registration Error', registrationResult.error || 'Failed to create account.');
          setIsLoading(false);
          return;
        }

        onToast('success', 'Account Created!', 'Your student profile is ready. Logged in!');
        onLoginSuccess(registrationResult.user);
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl mb-4">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 id="auth-title" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isLogin ? 'Campus Event Portal' : 'Create Student Account'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isLogin ? 'Sign in to discover, schedule and register for events' : 'Join your peers and register for academic and cultural events'}
          </p>
        </div>

        {/* Role Toggle Selector (Login mode only) */}
        {isLogin && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg mb-6">
            <button
              id="role-btn-student"
              type="button"
              onClick={() => setRole('student')}
              className={`py-2 text-xs font-medium rounded-md transition-all ${
                role === 'student'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Student Access
            </button>
            <button
              id="role-btn-admin"
              type="button"
              onClick={() => setRole('admin')}
              className={`py-2 text-xs font-medium rounded-md transition-all ${
                role === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Administrator
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                    <input
                      id="signup-name-input"
                      type="text"
                      required
                      placeholder="Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Roll / Student ID</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                      <input
                        id="signup-roll-input"
                        type="text"
                        placeholder="CS-2024-048"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Department</label>
                    <input
                      id="signup-dept-input"
                      type="text"
                      placeholder="Information Tech"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">College Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder={role === 'student' ? 'student@college.edu' : 'admin@college.edu'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-white"
              />
              <button
                id="toggle-pwd-btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-sm disabled:bg-blue-450"
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : isLogin ? (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In as {role === 'student' ? 'Student' : 'Admin'}</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Student Profile</span>
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">Demo Access</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
        </div>

        {/* Demo Fast Fill Section */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            id="quick-student-fill"
            type="button"
            onClick={() => handleQuickFill('student')}
            className="p-2.5 text-left border border-slate-200 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-950 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 rounded-lg transition-all"
          >
            <div className="flex items-center space-x-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <UserIcon className="h-3.5 w-3.5 text-emerald-500" />
              <span>Student Profile</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">student@college.edu</div>
          </button>
          <button
            id="quick-admin-fill"
            type="button"
            onClick={() => handleQuickFill('admin')}
            className="p-2.5 text-left border border-slate-200 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-950 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 rounded-lg transition-all"
          >
            <div className="flex items-center space-x-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
              <span>Admin Profile</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-1">admin@college.edu</div>
          </button>
        </div>

        <div className="text-center">
          <button
            id="auth-toggle-mode-btn"
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setRole('student');
            }}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isLogin ? "Don't have a student account? Sign up here" : 'Already have an account? Sign in here'}
          </button>
        </div>
      </div>
    </div>
  );
}
