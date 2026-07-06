import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  setPersistence, 
  browserLocalPersistence,
  sendEmailVerification,
  User,
  signOut
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Mail, RefreshCw, LogOut } from 'lucide-react';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      const errorCode = err.code || '';
      const errorMessage = err.message || '';
      
      if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('auth/email-already-in-use')) {
        setError('该邮箱已被注册');
      } else if (
        errorCode === 'auth/user-not-found' || 
        errorCode === 'auth/wrong-password' || 
        errorCode === 'auth/invalid-credential' ||
        errorMessage.includes('auth/user-not-found') ||
        errorMessage.includes('auth/wrong-password') ||
        errorMessage.includes('auth/invalid-credential')
      ) {
        setError('邮箱或密码错误');
      } else if (errorCode === 'auth/weak-password' || errorMessage.includes('auth/weak-password')) {
        setError('密码太弱，请使用至少 6 位字符');
      } else if (errorCode === 'auth/invalid-email' || errorMessage.includes('auth/invalid-email')) {
        setError('电子邮箱格式不正确');
      } else if (errorCode === 'auth/too-many-requests' || errorMessage.includes('auth/too-many-requests')) {
        setError('操作过于频繁，请稍后再试');
      } else {
        setError('发生错误，请稍后再试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 relative overflow-hidden">
      {/* Background decoration matching main app */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-200/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-sm px-8"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-800 mb-2">
            {isLogin ? '登录' : '创建账户'}
          </h1>
          <p className="text-slate-500 text-sm">
            开始你的极简词汇学习之旅
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="电子邮件"
                className="w-full bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                className="w-full bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-sm text-center flex flex-col items-center gap-1"
              >
                <span>{error}</span>
                {error.includes('已被注册') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setError(null);
                    }}
                    className="text-emerald-600 font-semibold hover:underline text-xs mt-0.5"
                  >
                    立即切换到登录
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 text-white rounded-xl py-3 font-medium flex items-center justify-center hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-slate-500 text-sm hover:text-slate-800 transition-colors"
          >
            {isLogin ? '没有账户？点击注册' : '已有账户？点击登录'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function EmailVerificationScreen({ user }: { user: User }) {
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleResend = async () => {
    setResending(true);
    setMessage(null);
    try {
      await sendEmailVerification(user);
      setMessage('验证邮件已重新发送，请查收。');
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        setMessage('发送频率过高，请稍后再试。');
      } else {
        setMessage('发送失败，请稍后再试。');
      }
    } finally {
      setResending(false);
    }
  };

  const checkVerification = async () => {
    await user.reload();
    // After reload, the App component's listener or re-render might catch the updated emailVerified.
    // If we want to force an update we can just reload the window, as firebase will pick up the new state.
    if (auth.currentUser?.emailVerified) {
      window.location.reload();
    } else {
      setMessage('尚未验证，请查收邮件并点击验证链接。');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-200/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 w-full max-w-sm px-8 text-center"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800 mb-4">
          验证你的电子邮件
        </h1>
        
        <p className="text-slate-600 text-sm mb-8 leading-relaxed">
          我们已向 <strong>{user.email}</strong> 发送了一封包含验证链接的邮件。请点击链接验证你的账户。
        </p>

        <div className="space-y-4">
          <button
            onClick={checkVerification}
            className="w-full bg-emerald-600 text-white rounded-xl py-3 font-medium flex items-center justify-center hover:bg-emerald-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            我已验证，点击刷新
          </button>
          
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl py-3 font-medium flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {resending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {resending ? '发送中...' : '重新发送验证邮件'}
          </button>

          <button
            onClick={() => signOut(auth)}
            className="w-full text-slate-500 rounded-xl py-3 font-medium flex items-center justify-center hover:text-slate-800 transition-colors mt-4"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </button>
        </div>

        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 text-sm text-slate-600 bg-slate-200/50 py-2 px-4 rounded-lg"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
