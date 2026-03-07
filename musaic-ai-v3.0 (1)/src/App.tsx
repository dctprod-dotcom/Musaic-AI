import React, { useState, useEffect } from 'react';
import './index.css';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Shield, 
  Zap, 
  ChevronRight, 
  Lock, 
  Mail,
  AlertCircle,
  Loader2,
  Radio,
  Menu,
  X,
  User,
  HelpCircle,
  Trash2,
  LayoutGrid,
  Video,
  FileText,
  Target,
  LogOut,
  Globe,
  BookOpen,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, initFirebase, googleProvider } from './firebase';
import { LandingPage } from './components/LandingPage';
import { SpotlightEditor } from './components/SpotlightEditor';
import { VideoGenerator } from './components/VideoGenerator';
import { PressKitModule } from './components/PressKitModule';
import { ReleaseStrategy } from './components/ReleaseStrategy';
import { SpotlightPublic } from './components/SpotlightPublic';
import { Tutorials } from './components/Tutorials';
import { ArtworkGenerator } from './components/ArtworkGenerator';
import { Membership } from './components/Membership';
import { Header, LanguageCode } from './components/Header';
import { Footer } from './components/Footer';
import { InfoPages } from './components/InfoPages';
import { AIPreferences, DEFAULT_AI_PREFERENCES } from './types';
import { AIPreferencesModal } from './components/AIPreferencesModal';

const ADMIN_EMAIL = "contact.musaicai@gmail.com";

// Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
          <div className="space-y-6 max-w-md">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/40">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">System Failure</h1>
            <p className="text-gray-400 text-sm font-medium">
              {this.state.error?.message || "An unexpected error occurred in the Musaic core."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white text-black font-black italic uppercase tracking-widest rounded-xl hover:bg-turquoise transition-all"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeModule, setActiveModule] = useState<'landing' | 'smart-link' | 'video' | 'epk' | 'strategy' | 'tutorials' | 'artwork' | 'membership' | 'about' | 'faq' | 'privacy' | 'terms' | 'contact'>('landing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [aiPreferences, setAIPreferences] = useState<AIPreferences>(DEFAULT_AI_PREFERENCES);
  const [showAIModal, setShowAIModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // initFirebase(); // No longer needed as side-effect, but good for logging
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (u) {
          // Admin Privilege Injection
          const isSuperAdmin = u.email === ADMIN_EMAIL;
          const enhancedUser = {
            ...u,
            isPro: isSuperAdmin || (u as any).isPro,
            points: isSuperAdmin ? 999999 : ((u as any).points || 50)
          };
          
          setUser(enhancedUser);
          if (isSuperAdmin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }

          // If user logs in and is on landing page, go to smart-link
          setActiveModule(prev => prev === 'landing' ? 'smart-link' : prev);
        } else {
          setUser(null);
          setIsAdmin(false);
          // If user logs out, go to landing page
          setActiveModule('landing');
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      console.error("Firebase Auth not initialized");
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!email || !password) {
      setAuthError('ALL FIELDS ARE REQUIRED.');
      return;
    }

    setIsLoggingIn(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowAuthModal(false);
    } catch (error: any) {
      console.error("Auth Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setAuthError('ACCOUNT ALREADY EXISTS. PLEASE LOGIN.');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setAuthError('INVALID CREDENTIALS. CHECK YOUR PASSWORD.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('PASSWORD TOO WEAK. USE 6+ CHARACTERS.');
      } else {
        setAuthError(`AUTH ERROR: ${error.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setAuthError('GOOGLE AUTHENTICATION CANCELLED.');
      } else {
        setAuthError(`GOOGLE AUTH ERROR: ${error.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('PLEASE ENTER YOUR EMAIL FIRST.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setAuthError(null);
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      setAuthError(`RESET ERROR: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    navigate('/');
  };

  const t = (key: string) => key; // Simple translation placeholder

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-turquoise animate-spin" />
      </div>
    );
  }

  // Public Route
  if (location.pathname.startsWith('/s/')) {
    return <SpotlightPublic />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-turquoise selection:text-black antialiased overflow-x-hidden">
        <Header 
          user={user} 
          isAdmin={isAdmin} 
          isStarted={!!user}
          onLogin={() => {
            setShowAuthModal(true);
            setIsSignUp(false);
            setAuthError(null);
            setResetSent(false);
          }} 
          onSignUp={() => {
            setShowAuthModal(true);
            setIsSignUp(true);
            setAuthError(null);
            setResetSent(false);
          }} 
          onMenuOpen={() => setIsMenuOpen(true)}
          currentLang={currentLang}
          onLangChange={setCurrentLang}
        />
        
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-[80px]"
            >
              {activeModule === 'landing' && (
                <LandingPage onGetStarted={() => {
                  setShowAuthModal(true);
                  setIsSignUp(true); // Default to Sign Up for "Get Started"
                  setAuthError(null);
                  setResetSent(false);
                }} />
              )}
              {['about', 'faq', 'privacy', 'terms', 'contact'].includes(activeModule) && (
                <InfoPages page={activeModule as any} lang={currentLang} />
              )}

              {/* Auth Modal */}
              <AnimatePresence>
                {showAuthModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowAuthModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-turquoise to-purple-neon" />
                      
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
                          {isSignUp ? "Join The Club" : "Access Studio"}
                        </h2>
                        <p className="text-white/40 text-xs font-medium tracking-widest uppercase">
                          {isSignUp ? "Create your account" : "Enter your credentials"}
                        </p>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-6">
                        {authError && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-3 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                          >
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-red-500 font-black italic uppercase tracking-wider text-xs">Auth Error</h4>
                              <p className="text-red-400/80 text-[10px] font-medium leading-relaxed uppercase tracking-wide">
                                {authError}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {resetSent && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-turquoise/10 border border-turquoise/50 p-4 rounded-xl flex items-start gap-3 shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                          >
                            <div className="w-5 h-5 rounded-full bg-turquoise/20 flex items-center justify-center shrink-0 mt-0.5">
                              <div className="w-2 h-2 rounded-full bg-turquoise animate-pulse" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-turquoise font-black italic uppercase tracking-wider text-xs">Reset Link Sent</h4>
                              <p className="text-turquoise/80 text-[10px] font-medium leading-relaxed uppercase tracking-wide">
                                Check your inbox to reset your password.
                              </p>
                            </div>
                          </motion.div>
                        )}

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40 ml-4">
                              Email Address
                            </label>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise transition-colors" />
                              <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 focus:bg-white/5 transition-all text-sm font-medium placeholder:text-white/10"
                                placeholder="name@example.com"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black italic uppercase tracking-widest text-white/40 ml-4">
                              Password
                            </label>
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-turquoise transition-colors" />
                              <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-turquoise/40 focus:bg-white/5 transition-all text-sm font-medium placeholder:text-white/10"
                                placeholder="••••••••"
                              />
                            </div>
                            {!isSignUp && (
                              <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-[10px] font-medium text-white/30 hover:text-turquoise transition-colors ml-4 uppercase tracking-wider"
                              >
                                Forgot Password?
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 pt-4">
                          <button 
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full bg-white text-black font-black italic uppercase tracking-widest py-4 rounded-xl hover:bg-turquoise transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isLoggingIn ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Authorizing...</span>
                              </>
                            ) : (isSignUp ? "Create Account" : "Sign In")}
                          </button>

                          <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-white/10"></div>
                            <span className="flex-shrink-0 mx-4 text-white/20 text-[10px] font-black italic uppercase tracking-widest">Or Continue With</span>
                            <div className="flex-grow border-t border-white/10"></div>
                          </div>

                          <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={isLoggingIn}
                            className="w-full bg-white/5 text-white border border-white/10 font-black italic uppercase tracking-widest py-4 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                          </button>

                          <div className="text-center pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsSignUp(!isSignUp);
                                setAuthError(null);
                                setResetSent(false);
                              }}
                              className="text-[10px] font-medium text-white/40 hover:text-turquoise transition-colors uppercase tracking-wider"
                            >
                              {isSignUp ? "Already have an account? Sign In" : "New here? Create Account"}
                            </button>
                          </div>
                        </div>
                      </form>

                      <button 
                        onClick={() => setShowAuthModal(false)}
                        className="absolute top-4 right-4 p-2 text-white/20 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div 
              key="studio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-screen flex flex-col pt-[80px]"
            >
              {/* Main Layout */}
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="hidden lg:flex flex-col w-20 xl:w-72 border-r border-white/5 bg-[#050505]/50 backdrop-blur-xl">
                  <div className="flex-1 py-8 px-4 space-y-4">
                    {[
                      { id: 'smart-link', icon: LayoutGrid, label: 'Smart Link' },
                      { id: 'artwork', icon: ImageIcon, label: 'Artwork Studio' },
                      { id: 'video', icon: Video, label: 'Video Generator' },
                      { id: 'epk', icon: FileText, label: 'Press Kit' },
                      { id: 'strategy', icon: Target, label: 'Release Strategy' },
                      { id: 'tutorials', icon: BookOpen, label: 'Tutorials' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id as any)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                          activeModule === item.id 
                            ? 'bg-white/10 text-white shadow-lg shadow-white/5' 
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <item.icon className={`w-6 h-6 ${activeModule === item.id ? 'text-turquoise' : 'group-hover:text-turquoise transition-colors'}`} />
                        <span className="hidden xl:block text-xs font-black italic uppercase tracking-widest">{item.label}</span>
                        {activeModule === item.id && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-turquoise shadow-[0_0_10px_rgba(0,255,255,0.8)] hidden xl:block" />
                        )}
                      </button>
                    ))}

                    <div className="h-px bg-white/5 my-4" />
                    
                    <button
                      onClick={() => setShowAIModal(true)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all group text-white/40 hover:text-white hover:bg-white/5"
                    >
                      <Sparkles className="w-6 h-6 group-hover:text-purple-500 transition-colors" />
                      <span className="hidden xl:block text-xs font-black italic uppercase tracking-widest">AI Persona</span>
                    </button>
                  </div>
                </aside>

                {/* Mobile Navigation Bar */}
                <div className="lg:hidden flex overflow-x-auto p-4 gap-4 border-b border-white/5 bg-[#050505]">
                   {[
                      { id: 'smart-link', icon: LayoutGrid, label: 'Smart Link' },
                      { id: 'artwork', icon: ImageIcon, label: 'Artwork' },
                      { id: 'video', icon: Video, label: 'Video' },
                      { id: 'epk', icon: FileText, label: 'EPK' },
                      { id: 'strategy', icon: Target, label: 'Strategy' },
                      { id: 'tutorials', icon: BookOpen, label: 'Tutorials' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id as any)}
                        className={`flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl transition-all ${
                          activeModule === item.id 
                            ? 'bg-white/10 text-white border border-white/10' 
                            : 'text-white/40 border border-transparent'
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-[10px] font-black italic uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setShowAIModal(true)}
                      className="flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-xl transition-all text-white/40 border border-transparent"
                    >
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-[10px] font-black italic uppercase tracking-widest">AI Persona</span>
                    </button>
                </div>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-[#050505] to-[#0B0E14] relative">
                  <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeModule}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="relative z-10 min-h-full"
                    >
                      {activeModule === 'smart-link' && <SpotlightEditor user={user || { uid: 'guest' }} t={t} onBack={() => {}} generatedAssets={{}} />}
                      {activeModule === 'artwork' && <ArtworkGenerator aiPreferences={aiPreferences} />}
                      {activeModule === 'video' && <VideoGenerator aiPreferences={aiPreferences} />}
                      {activeModule === 'epk' && <PressKitModule lang={currentLang} aiPreferences={aiPreferences} />}
                      {activeModule === 'strategy' && <ReleaseStrategy />}
                      {activeModule === 'tutorials' && <Tutorials />}
                      {activeModule === 'membership' && <Membership user={user} lang={currentLang} />}
                      {['about', 'faq', 'privacy', 'terms', 'contact'].includes(activeModule) && (
                        <InfoPages page={activeModule as any} lang={currentLang} />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Footer - Hide on editor pages if needed, currently shown everywhere except maybe full-screen editors if we wanted */}
                  {activeModule !== 'smart-link' && (
                    <Footer 
                      lang={currentLang} 
                      onNavigate={(page) => {
                        setActiveModule(page);
                        window.scrollTo(0, 0);
                      }} 
                    />
                  )}
                </main>
              </div>

              {/* Hamburger Menu Modal */}
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsMenuOpen(false)}
                      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                    />
                    <motion.div 
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      className="fixed top-0 right-0 h-full w-80 bg-[#0B0E14] border-l border-white/10 z-[70] p-8 shadow-2xl"
                    >
                      <div className="flex items-center justify-between mb-12">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Menu</h3>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                          <X className="w-6 h-6 text-white" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                          <User className="w-5 h-5 text-white/40 group-hover:text-turquoise transition-colors" />
                          <span className="text-xs font-black italic uppercase tracking-widest text-white/60 group-hover:text-white">My Account</span>
                        </button>
                        <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left">
                          <HelpCircle className="w-5 h-5 text-white/40 group-hover:text-turquoise transition-colors" />
                          <span className="text-xs font-black italic uppercase tracking-widest text-white/60 group-hover:text-white">FAQ & Support</span>
                        </button>
                        <div className="h-px bg-white/5 my-4" />
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left"
                        >
                          <LogOut className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                          <span className="text-xs font-black italic uppercase tracking-widest text-white/60 group-hover:text-white">Sign Out</span>
                        </button>
                        <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 transition-all group text-left mt-8">
                          <Trash2 className="w-5 h-5 text-red-500/60 group-hover:text-red-500 transition-colors" />
                          <span className="text-xs font-black italic uppercase tracking-widest text-red-500/60 group-hover:text-red-500">Delete Account</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AIPreferencesModal 
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        preferences={aiPreferences}
        onUpdate={setAIPreferences}
      />
    </ErrorBoundary>
  );
}

export default App;
