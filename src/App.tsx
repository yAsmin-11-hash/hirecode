import React, { useState, ReactNode, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";
import Lenis from 'lenis';
import { 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import Onboarding from "./components/Onboarding";
import DynamicContent from "./components/DynamicContent";
import ResponsiveImage from "./components/ResponsiveImage";
import { Modal } from "./components/ui/Modal";
import { Button } from "./components/ui/Button";
import { ContactSection } from "./components/ContactSection";
import { 
  Globe, 
  Zap, 
  BarChart3, 
  Code2, 
  ShieldCheck,
  Smartphone,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Search
} from 'lucide-react';

const Logo = ({ size = "normal", onClick }: { size?: "small" | "normal", onClick?: () => void }) => {
  const isSmall = size === "small";
  return (
    <div className="flex items-center group cursor-pointer select-none" onClick={onClick}>
      <span className={`${isSmall ? 'text-[24px]' : 'text-[28px]'} font-bold tracking-[-0.08em] text-white flex items-center`}>
        hire
        <span className="relative flex items-center text-c-violet">
          code
          <div className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-c-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </span>
      </span>
    </div>
  );
};

const Navbar = ({ 
  user, 
  onSignInClick, 
  onSignOut,
  onLogoClick 
}: { 
  user: User | null, 
  onSignInClick: () => void, 
  onSignOut: () => void,
  onLogoClick: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    // Optional: close search or clear query after submit
    // setIsSearchOpen(false);
    // setSearchQuery("");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 bg-c-bg/80 backdrop-blur-md border-b border-white/5 shadow-sm">
      <Logo onClick={onLogoClick} />
      
      <div className="hidden md:flex items-center gap-10 text-[15px] font-bold text-white">
        {['Personal', 'Business', 'Developer', 'Help'].map((item) => (
          <a key={item} href={`#${item.toLowerCase()}`} className="relative group hover:text-c-violet transition-colors">
            {item}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex items-center">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.form
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSearch}
                className="overflow-hidden mr-2"
              >
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-c-violet"
                  autoFocus
                />
              </motion.form>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5"
            aria-label="Toggle search"
          >
            <Search size={20} />
          </button>
        </div>

        {user ? (
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 p-1 pr-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=7c5cfc&color=fff`} 
                alt="User" 
                className="w-8 h-8 rounded-full border border-white/10"
              />
              <span className="text-sm font-bold text-white hidden sm:block">
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
            </button>

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 bg-c-surface border border-white/10 rounded-2xl shadow-2xl p-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-white/5 mb-2">
                    <p className="text-xs font-bold text-c-dim uppercase tracking-widest mb-1">Signed in as</p>
                    <p className="text-sm font-bold text-white truncate">{user.email}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-c-text hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3">
                    <span>📊</span> Dashboard
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-c-text hover:bg-white/5 rounded-xl transition-colors flex items-center gap-3">
                    <span>⚙️</span> Settings
                  </button>
                  <hr className="my-2 border-white/5" />
                  <button 
                    onClick={() => {
                      onSignOut();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-400/5 rounded-xl transition-colors flex items-center gap-3"
                  >
                    <span>🚪</span> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            <Button 
              onClick={onSignInClick}
              variant="ghost"
              className="hidden sm:inline-flex"
            >
              Sign in
            </Button>
            <Button 
              onClick={onSignInClick}
              variant="primary"
            >
              Get started
            </Button>
          </>
        )}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-c-text">
          {isOpen ? <span className="text-xl">❌</span> : <span className="text-xl">☰</span>}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-c-surface border-b border-white/5 p-8 flex flex-col gap-6 md:hidden shadow-2xl"
          >
            <a href="#features" onClick={() => setIsOpen(false)} className="text-lg font-semibold text-c-text">Products</a>
            <a href="#developers" onClick={() => setIsOpen(false)} className="text-lg font-semibold text-c-text">Developers</a>
            <a href="#pricing" onClick={() => setIsOpen(false)} className="text-lg font-semibold text-c-text">Pricing</a>
            <a href="#use-cases" onClick={() => setIsOpen(false)} className="text-lg font-semibold text-c-text">Solutions</a>
            <hr className="border-white/5" />
            {user ? (
              <button 
                onClick={() => {
                  onSignOut();
                  setIsOpen(false);
                }}
                className="text-left text-lg font-semibold text-red-400"
              >
                Sign out
              </button>
            ) : (
              <button 
                onClick={() => {
                  onSignInClick();
                  setIsOpen(false);
                }}
                className="text-left text-lg font-semibold text-c-violet"
              >
                Sign in
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const FloatingCard = ({ 
  children, 
  className = "", 
  delay = 0, 
  duration = 5,
  yOffset = 10,
}: { 
  children: ReactNode, 
  className?: string, 
  delay?: number, 
  duration?: number,
  yOffset?: number,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
      }}
      transition={{ 
        duration: 1.2, 
        delay,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`absolute z-20 ${className}`}
    >
      <motion.div
        animate={{
          y: [0, -yOffset, 0],
        }}
        transition={{
          y: { duration, repeat: Infinity, ease: "easeInOut" },
        }}
        className="bg-c-surface border border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex items-center gap-4">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
};

const TypingParagraph = ({ text, delay = 0, onComplete }: { text: string, delay?: number, onComplete?: () => void }) => {
  const characters = text.split("");
  
  return (
    <div className="text-lg md:text-xl text-c-muted mb-12 max-w-xl leading-relaxed relative">
      {characters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.2, 
            delay: delay + i * 0.01,
            ease: "easeOut"
          }}
          onAnimationComplete={() => {
            if (i === characters.length - 1 && onComplete) {
              onComplete();
            }
          }}
        >
          {char}
        </motion.span>
      ))}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: [1, 0] }}
        transition={{ 
          duration: 0.8, 
          repeat: Infinity,
          delay: delay
        }}
        className="inline-block w-[2px] h-[1.1em] bg-c-violet ml-0.5 align-middle"
      />
    </div>
  );
};

const TypewriterLine: React.FC<{ text: string, color: string, indent?: boolean, delay: number, nextDelay?: number, isLastLine?: boolean }> = ({ text, color, indent, delay, nextDelay, isLastLine }) => {
  const typingDuration = text.length * 0.03;
  const jitterCount = Math.max(0, Math.floor(typingDuration / 0.05));

  return (
    <div className={`${color} ${indent ? 'pl-6' : ''} whitespace-pre min-h-[1.5em]`}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ display: 'none', opacity: 0 }}
          whileInView={{ display: 'inline', opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.01, delay: delay + index * 0.03 }}
        >
          {char}
        </motion.span>
      ))}
      <motion.span
        initial={{ opacity: 0, x: 0 }}
        whileInView={{
          ...(isLastLine ? { opacity: 1 } : { opacity: [0, 1, 1, 0] }),
          x: text.length > 0 ? [0, 2, 0] : 0
        }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{
          opacity: isLastLine 
            ? { duration: 0.01, delay: delay } 
            : { times: [0, 0.01, 0.99, 1], duration: nextDelay! - delay, delay: delay },
          x: {
            duration: 0.05,
            repeat: jitterCount,
            delay: delay
          }
        }}
        className="inline-flex items-center"
      >
        <span className="inline-block w-2 h-4 bg-c-violet ml-1 align-middle animate-blink" />
      </motion.span>
    </div>
  );
};

const CodeTyper = () => {
  const codeLines = [
    { text: "import { HireCode } from '@hirecode/sdk';", color: "text-c-pink" },
    { text: "", color: "" },
    { text: "const hirecode = new HireCode('sk_live_...');", color: "text-c-indigo" },
    { text: "", color: "" },
    { text: "const payment = await hirecode.payments.create({", color: "text-white" },
    { text: "  amount: 124500,", color: "text-c-teal", indent: true },
    { text: "  currency: 'usd',", color: "text-c-teal", indent: true },
    { text: "  destination: 'acct_1234',", color: "text-c-teal", indent: true },
    { text: "});", color: "text-white" },
    { text: "", color: "" },
    { text: "console.log('Payment successful! 🎉');", color: "text-c-violet" }
  ];

  let currentDelay = 1.3; // 0.5s container delay + 0.8s container duration
  const linesWithDelays = codeLines.map(line => {
    const delay = currentDelay;
    currentDelay += line.text ? (line.text.length * 0.03) + 0.15 : 0.1;
    return { ...line, delay, nextDelay: currentDelay };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 60 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="code-window w-full text-left font-mono text-sm leading-relaxed shadow-2xl"
    >
      <div className="mockup-bar">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        <span className="ml-2 text-[10px] font-bold text-c-dim uppercase tracking-widest">payment.ts</span>
      </div>
      <div className="p-6 md:p-8 overflow-x-auto">
        {linesWithDelays.map((line, i) => (
          <TypewriterLine 
            key={i} 
            text={line.text} 
            color={line.color} 
            indent={line.indent} 
            delay={line.delay} 
            nextDelay={line.nextDelay}
            isLastLine={i === linesWithDelays.length - 1}
          />
        ))}
      </div>
    </motion.div>
  );
};

const Hero = () => {
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isLearnMoreOpen, setIsLearnMoreOpen] = useState(false);

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center bg-c-bg">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-c-violet/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="text-left space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] flex flex-col gap-2">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="block"
              >
                Financial
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 150,
                  damping: 12
                }}
                className="block bg-clip-text text-transparent bg-linear-to-r from-c-violet via-white to-c-violet bg-[length:200%_auto] animate-shimmer"
              >
                infrastructure
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="block"
              >
                for the internet
              </motion.span>
            </h1>
            
            <TypingParagraph 
              text="Join millions of users worldwide who trust HireCode to send money, make payments, and manage their business with total peace of mind."
              delay={0.5}
              onComplete={() => setIsTypingComplete(true)}
            />
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isTypingComplete ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-4"
          >
            <Button size="lg" variant="primary">
              Sign Up for Free
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setIsLearnMoreOpen(true)}
              className="border-c-violet text-c-violet hover:bg-c-violet/10 hover:border-c-violet/30"
            >
              Learn More
            </Button>
          </motion.div>

          <Modal isOpen={isLearnMoreOpen} onClose={() => setIsLearnMoreOpen(false)} title="Explore HireCode Infrastructure">
            <div className="space-y-6 text-c-muted">
              <p>
                HireCode provides a complete toolkit for internet businesses. Whether you’re creating a subscription service, an on-demand marketplace, an e-commerce store, or a crowdfunding platform, HireCode’s meticulously designed APIs and unmatched functionality help you create the best possible product for your users.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h4 className="text-white font-bold text-lg mb-2">Global Payments</h4>
                  <p className="text-sm">Accept credit cards, debit cards, and popular payment methods around the world with a single integration.</p>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h4 className="text-white font-bold text-lg mb-2">Revenue Management</h4>
                  <p className="text-sm">Automate billing, handle subscriptions, and manage recurring revenue with powerful tools.</p>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h4 className="text-white font-bold text-lg mb-2">Fraud Prevention</h4>
                  <p className="text-sm">Protect your business from fraud with machine learning models trained on billions of data points.</p>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h4 className="text-white font-bold text-lg mb-2">Developer First</h4>
                  <p className="text-sm">Build faster with our comprehensive documentation, client libraries, and robust testing environments.</p>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-white/10 flex justify-end">
                <Button onClick={() => setIsLearnMoreOpen(false)}>Got it</Button>
              </div>
            </div>
          </Modal>


        </div>

        <div className="relative lg:h-[600px] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[600px]"
          >
            {/* Main Visual - Code Window */}
            <div className="relative z-10 w-full">
              <CodeTyper />
            </div>

            {/* Floating Interactive Cards */}
            <FloatingCard className="-top-6 -left-12 shadow-2xl" delay={0.8} duration={6}>
              <div className="w-10 h-10 bg-c-teal/20 rounded-full flex items-center justify-center text-c-teal shadow-lg shadow-c-teal/20">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-c-dim uppercase tracking-widest leading-none mb-1">Success</p>
                <p className="text-sm font-bold text-white">Payment Received</p>
              </div>
            </FloatingCard>

            <FloatingCard className="top-1/2 -right-16 shadow-2xl" delay={1.5} duration={7} yOffset={-15}>
              <div className="w-10 h-10 bg-c-pink/20 rounded-full flex items-center justify-center text-c-pink shadow-lg shadow-c-pink/20">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-c-dim uppercase tracking-widest leading-none mb-1">Speed</p>
                <p className="text-sm font-bold text-white">Instant Settlement</p>
              </div>
            </FloatingCard>

            <FloatingCard className="-bottom-8 left-8 shadow-2xl" delay={1.2} duration={5}>
              <div className="w-10 h-10 bg-c-violet/20 rounded-full flex items-center justify-center text-c-violet shadow-lg shadow-c-violet/20">
                <span className="text-lg">💳</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-c-dim uppercase tracking-widest leading-none mb-1">Security</p>
                <p className="text-sm font-bold text-white">Encryption Active</p>
              </div>
            </FloatingCard>

            {/* Decorative Background Circles */}
            <motion.div 
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[100px] opacity-50 bg-linear-to-tr from-c-violet/40 to-c-teal/20" 
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
const SolutionsSection = () => {
  return (
    <section className="py-24 px-6 bg-c-bg">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Personal Solution */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden rounded-[40px] bg-c-surface p-12 hover:bg-white/5 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/5"
          >
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-c-violet/10 rounded-2xl flex items-center justify-center text-c-violet shadow-sm">
                <Smartphone size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white">For Individuals</h3>
              <p className="text-c-muted text-lg leading-relaxed">
                Send money to friends, shop online with confidence, and manage your daily spending all in one place.
              </p>
              <button className="text-c-violet font-bold flex items-center gap-2 group-hover:gap-4 transition-all duration-300">
                Learn about Personal <span className="text-xl">→</span>
              </button>
            </div>
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <img src="https://picsum.photos/seed/personal/800/800" alt="Personal" className="w-full h-full object-cover rounded-tl-[100px]" referrerPolicy="no-referrer" />
            </div>
          </motion.div>

          {/* Business Solution */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden rounded-[40px] bg-c-surface p-12 hover:bg-white/5 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/5"
          >
            <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-c-teal/10 rounded-2xl flex items-center justify-center text-c-teal backdrop-blur-sm">
                <Globe size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white">For Businesses</h3>
              <p className="text-c-muted text-lg leading-relaxed">
                Accept payments globally, automate your payouts, and scale your business with our enterprise-grade infrastructure.
              </p>
              <button className="text-c-teal font-bold flex items-center gap-2 group-hover:gap-4 transition-all duration-300">
                Explore Business Solutions <span className="text-xl">→</span>
              </button>
            </div>
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <img src="https://picsum.photos/seed/business/800/800" alt="Business" className="w-full h-full object-cover rounded-tl-[100px]" referrerPolicy="no-referrer" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const LogoCloud = () => {
  const logos = [
    { name: 'Stripe', icon: 'stripe' },
    { name: 'Visa', icon: 'visa' },
    { name: 'Mastercard', icon: 'mastercard' },
    { name: 'Amex', icon: 'americanexpress' },
    { name: 'PayPal', icon: 'paypal' },
    { name: 'Apple Pay', icon: 'applepay' },
    { name: 'Google Pay', icon: 'googlepay' },
    { name: 'Revolut', icon: 'revolut' },
    { name: 'Wise', icon: 'wise' },
    { name: 'Coinbase', icon: 'coinbase' },
  ];

  const allLogos = [...logos, ...logos];

  return (
    <div className="py-20 bg-c-surface border-y border-white/5 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <p className="text-xs font-bold text-c-violet uppercase tracking-widest mb-4">Global Network</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
          Trusted by millions of <span className="text-c-violet">businesses worldwide</span>
        </h2>
      </div>
      
      <div className="flex overflow-hidden group">
        <div className="flex animate-marquee whitespace-nowrap py-8">
          {allLogos.map((logo, i) => (
            <div 
              key={`${logo.name}-${i}`}
              className="flex items-center gap-4 px-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:scale-110 transition-all duration-500 cursor-default"
            >
              <img 
                src={`https://cdn.simpleicons.org/${logo.icon}/ffffff`}
                alt={logo.name}
                className="w-8 h-8"
                referrerPolicy="no-referrer"
              />
              <span className="text-xl font-bold text-white tracking-tight">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-y-0 left-0 w-32 bg-linear-to-r from-c-surface to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-linear-to-l from-c-surface to-transparent z-10 pointer-events-none" />
    </div>
  );
};

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
  delay?: number;
  color?: "violet" | "indigo" | "teal" | "pink" | "blue";
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }
      }}
      viewport={{ once: true, margin: "-100px" }}
      className="group p-8 rounded-3xl bg-c-surface border border-white/5 hover:border-c-violet/30 hover:shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 text-c-violet flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/10">
        <Icon size={28} strokeWidth={2} />
      </div>
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-c-muted leading-relaxed text-sm">{description}</p>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: Globe,
      title: "Global Payments",
      description: "Accept credit cards, wallets, and local payment methods securely worldwide with a single integration.",
    },
    {
      icon: Zap,
      title: "Instant Payouts",
      description: "Send money to vendors, partners, or employees in minutes, not days, with our optimized routing network.",
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track every transaction, monitor revenue trends, and optimize business performance with live data dashboards.",
    },
    {
      icon: Code2,
      title: "API Integration",
      description: "Developer-first APIs and SDKs that integrate seamlessly with your existing tech stack and workflows.",
    },
    {
      icon: ShieldCheck,
      title: "Advanced Security",
      description: "Enterprise-grade encryption and AI-powered fraud protection to keep your business and customers safe.",
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "A seamless checkout experience across all devices, ensuring your customers can pay anytime, anywhere.",
    },
  ];

  return (
    <section id="features" className="relative py-32 px-6 bg-c-bg overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-bold text-c-violet uppercase tracking-widest mb-4">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6 flex flex-col gap-1">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="block"
              >
                Everything you need to
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 30, scale: 1.02 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="block bg-clip-text text-transparent bg-linear-to-r from-c-violet via-c-pink to-c-violet bg-[length:200%_auto] animate-shimmer"
              >
                manage payments.
              </motion.span>
            </h2>
            <p className="text-c-muted max-w-2xl mx-auto text-lg">
              HireCode provides a comprehensive suite of tools designed to help you scale your business and reach customers globally.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <FeatureCard 
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={idx * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const ProductDemo = () => {
  const [activeTab, setActiveTab] = useState('payments');

  const tabs = [
    { id: 'payments', label: 'Payments', icon: <span className="text-sm">💳</span> },
    { id: 'analytics', label: 'Analytics', icon: <span className="text-sm">📊</span> },
    { id: 'api', label: 'API', icon: <span className="text-sm">⌨️</span> },
  ];

  return (
    <section className="py-32 bg-c-surface px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
        <div>
          <div className="tag mb-6">Product Suite</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white leading-tight flex flex-col gap-1">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="block"
            >
              Everything you need to
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30, scale: 1.02 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="block bg-clip-text text-transparent bg-linear-to-r from-c-violet via-c-pink to-c-violet bg-[length:200%_auto] animate-shimmer"
            >
              build and scale
            </motion.span>
          </h2>
          <p className="text-lg text-c-muted mb-10 max-w-lg leading-relaxed">
            HireCode provides a complete toolkit for developers and businesses. From simple checkout pages to complex marketplace logic, we've got you covered.
          </p>
          
          <div className="flex flex-wrap gap-3 mb-10">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-c-violet text-white shadow-lg shadow-c-violet/20' 
                    : 'bg-c-bg text-c-muted hover:text-white border border-white/5'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {[
              "Optimized checkout experience",
              "Real-time financial reporting",
              "24/7 developer support"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-c-text font-medium">
                <div className="w-5 h-5 rounded-full bg-c-teal/10 flex items-center justify-center">
                  <span className="text-[10px]">✅</span>
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-10 bg-c-violet/10 rounded-full blur-[100px] animate-pulse-custom" />
          
          {/* Floating Elements for Demo */}
          <FloatingCard className="-top-8 -left-8 scale-90" delay={0.5} yOffset={15} duration={5}>
            <div className="w-8 h-8 bg-c-teal/10 rounded-full flex items-center justify-center">
              <span className="text-sm">📊</span>
            </div>
            <p className="text-[9px] font-bold text-c-muted uppercase tracking-widest">Real-time Sync</p>
          </FloatingCard>

          <FloatingCard className="-bottom-8 -right-8 scale-90" delay={1.2} yOffset={-15} duration={4}>
            <div className="w-8 h-8 bg-c-violet/10 rounded-full flex items-center justify-center">
              <span className="text-sm">🔒</span>
            </div>
            <p className="text-[9px] font-bold text-c-muted uppercase tracking-widest">Secure Checkout</p>
          </FloatingCard>

          <div className="code-window min-h-[440px] relative z-10">
            <div className="mockup-bar">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              <span className="ml-2 text-[10px] font-mono text-c-dim uppercase tracking-widest">dashboard_preview.v1</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="p-8"
              >
                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-lg text-white">Recent Transactions</h4>
                      <span className="text-[10px] font-bold text-c-teal bg-c-teal/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Live</span>
                    </div>
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-c-surface2 rounded-full flex items-center justify-center border border-white/5">
                            <span className="text-lg">👥</span>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">Customer #{1200 + i}</p>
                            <p className="text-[11px] text-c-dim">2 mins ago • Card Payment</p>
                          </div>
                        </div>
                        <p className="font-bold text-c-teal">+${(Math.random() * 1000).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'analytics' && (
                  <div className="space-y-8">
                    <h4 className="font-bold text-lg text-white">Revenue Growth</h4>
                    <div className="h-40 w-full flex items-end justify-between gap-2.5">
                      {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: i * 0.1 }}
                          className="w-full bg-linear-to-t from-c-violet to-c-indigo rounded-t-lg shadow-[0_0_20px_rgba(124,92,252,0.2)]"
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-white/3 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-c-dim uppercase tracking-widest mb-1">Conversion</p>
                        <p className="text-2xl font-black text-white">3.2%</p>
                      </div>
                      <div className="p-5 bg-white/3 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-c-dim uppercase tracking-widest mb-1">Avg. Ticket</p>
                        <p className="text-2xl font-black text-white">$142.00</p>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'api' && (
                  <div className="font-mono text-[13px] text-c-text leading-relaxed">
                    <p className="text-c-violet">GET <span className="text-c-teal">/v1/balance</span></p>
                    <p className="mt-4 text-c-dim">{`{`}</p>
                    <p className="pl-5 text-c-dim">"object": <span className="text-c-teal">"balance"</span>,</p>
                    <p className="pl-5 text-c-dim">"available": [</p>
                    <p className="pl-10 text-c-dim">{`{`}</p>
                    <p className="pl-15 text-c-dim">"amount": <span className="text-c-pink">145000</span>,</p>
                    <p className="pl-15 text-c-dim">"currency": <span className="text-c-teal">"usd"</span></p>
                    <p className="pl-10 text-c-dim">{`}`}</p>
                    <p className="pl-5 text-c-dim">]</p>
                    <p className="text-c-dim">{`}`}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

const devCodeLineVariants = {
  hidden: { opacity: 0, x: -5 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
};

const DeveloperSection = () => (
  <section id="developers" className="py-32 bg-c-bg text-white px-6 relative overflow-hidden">
    <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-20 items-center">
      <div>
        <p className="text-xs font-bold text-c-violet uppercase tracking-widest mb-6">Developer First</p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 leading-tight flex flex-col gap-1">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="block"
          >
            Built for developers,
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30, scale: 1.02 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="block bg-clip-text text-transparent bg-linear-to-r from-c-violet via-c-pink to-c-violet bg-[length:200%_auto] animate-shimmer"
          >
            by developers.
          </motion.span>
        </h2>
        <p className="text-lg text-c-muted mb-12 max-w-lg leading-relaxed">
          We believe that financial infrastructure should be as easy to use as any other part of your stack. Our APIs are designed to be intuitive, powerful, and reliable.
        </p>
        
        <div className="grid sm:grid-cols-2 gap-10">
          <div className="space-y-3">
            <h4 className="font-bold text-white text-lg">Comprehensive Docs</h4>
            <p className="text-sm text-c-muted leading-relaxed">Everything you need to get started, from quickstart guides to detailed API references.</p>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-white text-lg">Client Libraries</h4>
            <p className="text-sm text-c-muted leading-relaxed">Official SDKs for Node.js, Python, Ruby, Go, Java, and more.</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <motion.div 
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-c-surface rounded-[40px] p-8 shadow-2xl overflow-hidden border border-white/5 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-500"
        >
          <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <span className="ml-2 text-[10px] font-mono text-white/30 uppercase tracking-widest">checkout.js</span>
          </div>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: {},
              visible: {
                transition: {
                  delayChildren: 1.0,
                  staggerChildren: 0.15
                }
              }
            }}
            className="font-mono text-[13px] leading-relaxed text-blue-100/80"
          >
            <motion.p variants={devCodeLineVariants} className="text-pink-400">import</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white"> {`{ loadHireCode }`} </motion.p>
            <motion.p variants={devCodeLineVariants} className="text-pink-400 inline">from</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-teal-400 inline"> '@hirecode/hirecode-js'</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white/30 mt-6">// Initialize with your public key</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-pink-400">const</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white inline"> hirecode = </motion.p>
            <motion.p variants={devCodeLineVariants} className="text-pink-400 inline">await</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white inline"> loadHireCode(</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-teal-400 inline">'pk_test_...'</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white inline">);</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white/30 mt-6">// Redirect to Checkout</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-pink-400">const</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white inline"> {`{ error }`} = </motion.p>
            <motion.p variants={devCodeLineVariants} className="text-pink-400 inline">await</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white inline"> hirecode.redirectToCheckout({`{`}</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white pl-5">lineItems: [{`{ price: 'price_...', quantity: 1 }`}],</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white pl-5">mode: <span className="text-teal-400">'payment'</span>,</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white pl-5">successUrl: <span className="text-teal-400">'https://example.com/success'</span>,</motion.p>
            <motion.p variants={devCodeLineVariants} className="text-white">{`}`});</motion.p>
            <motion.span variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }} className="inline-block w-2 h-4 bg-white/80 ml-1 align-middle animate-blink" />
          </motion.div>
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute -z-10 -top-10 -right-10 w-64 h-64 bg-c-violet/20 rounded-full blur-3xl" />
      </div>
    </div>
  </section>
);

const UseCases = () => (
  <section id="use-cases" className="py-32 bg-c-surface px-6 border-y border-white/5">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <p className="text-xs font-bold text-c-violet uppercase tracking-widest mb-6">Solutions</p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white leading-tight flex flex-col gap-1">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="block"
          >
            Solutions for every
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30, scale: 1.02 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="block bg-clip-text text-transparent bg-linear-to-r from-c-violet via-c-pink to-c-violet bg-[length:200%_auto] animate-shimmer"
          >
            stage of growth.
          </motion.span>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: <span className="text-2xl">🚀</span>, title: "Startups", desc: "Launch fast with pre-built UI components and simple APIs." },
          { icon: <span className="text-2xl">🏢</span>, title: "Enterprises", desc: "Scale globally with advanced security, compliance, and custom logic." },
          { icon: <span className="text-2xl">👥</span>, title: "Creators", desc: "Monetize your content and manage payouts to your global audience." },
        ].map((item, i) => (
          <div key={i} className="p-10 rounded-[32px] bg-c-bg border border-white/5 hover:border-c-violet/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-[0_0_40px_rgba(124,92,252,0.1)]">
            <div className="w-14 h-14 bg-white/5 rounded-2xl shadow-sm flex items-center justify-center mb-8 text-c-violet group-hover:scale-110 group-hover:bg-c-violet group-hover:text-white transition-all duration-300 border border-white/10">
              {item.icon}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white tracking-tight">{item.title}</h3>
            <p className="text-c-muted mb-8 leading-relaxed">{item.desc}</p>
            <a href="#" className="text-c-violet font-bold flex items-center gap-2 hover:gap-4 transition-all text-sm uppercase tracking-widest">
              Learn more <span className="text-sm">→</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Pricing = () => (
  <section id="pricing" className="py-32 bg-c-bg px-6">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <p className="text-xs font-bold text-c-violet uppercase tracking-widest mb-6">Pricing</p>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-white leading-tight flex flex-col gap-1">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="block"
          >
            Simple, transparent
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30, scale: 1.02 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="block bg-clip-text text-transparent bg-linear-to-r from-c-violet via-c-pink to-c-violet bg-[length:200%_auto] animate-shimmer"
          >
            pricing.
          </motion.span>
        </h2>
        <p className="text-lg text-c-muted">No hidden fees. Pay only for what you use.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
        <div className="p-12 rounded-[40px] bg-c-surface border border-white/5 shadow-sm hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(0,0,0,0.6)] transition-all duration-500">
          <h3 className="text-2xl font-bold mb-2 text-white">Integrated</h3>
          <p className="text-c-muted mb-10 text-sm leading-relaxed">A complete payments platform with everything you need to get started.</p>
          <div className="mb-10">
            <span className="text-6xl font-black text-white">2.9%</span>
            <span className="text-2xl text-c-dim font-bold ml-2"> + 30¢</span>
            <p className="text-[11px] font-bold text-c-dim mt-3 uppercase tracking-widest">per successful card charge</p>
          </div>
          <ul className="space-y-5 mb-12">
            {['No setup or monthly fees', '135+ currencies', 'Radar fraud protection', '24/7 support'].map(item => (
              <li key={item} className="flex items-center gap-3 text-white font-medium text-sm">
                <div className="w-5 h-5 rounded-full bg-c-teal/20 flex items-center justify-center text-c-teal">
                  <span className="text-[10px]">✓</span>
                </div>
                {item}
              </li>
            ))}
          </ul>
          <button className="w-full py-4 bg-c-violet text-white font-bold rounded-full hover:bg-c-violet/80 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(124,92,252,0.3)]">
            Get started
          </button>
        </div>

        <div className="p-12 rounded-[40px] bg-linear-to-b from-c-surface to-c-bg text-white border border-c-violet/30 shadow-[0_0_40px_rgba(124,92,252,0.15)] relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
          <div className="absolute top-0 right-0 p-6">
            <span className="bg-c-violet text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">Popular</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">Custom</h3>
          <p className="text-c-muted mb-10 text-sm leading-relaxed">Design a custom package for your business with high volume or unique models.</p>
          <div className="mb-10">
            <span className="text-4xl font-black">Let's talk</span>
          </div>
          <ul className="space-y-5 mb-12">
            {['Volume discounts', 'Multi-product discounts', 'Country-specific rates', 'Dedicated support'].map(item => (
              <li key={item} className="flex items-center gap-3 text-white font-medium text-sm">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <span className="text-[10px]">✓</span>
                </div>
                {item}
              </li>
            ))}
          </ul>
          <button className="w-full py-4 border-2 border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all duration-300">
            Contact sales
          </button>
        </div>
      </div>
    </div>
  </section>
);

interface TestimonialCardProps {
  t: any;
  index: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  key?: any;
}

const TestimonialCard = ({ t, index, containerRef }: TestimonialCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({
    container: containerRef,
    target: cardRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollXProgress, [0, 0.5, 1], [0.92, 1, 0.92]);
  const opacity = useTransform(scrollXProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.4]);
  const parallax = useTransform(scrollXProgress, [0, 1], [index % 2 === 0 ? 30 : -30, index % 2 === 0 ? -30 : 30]);
  const blur = useTransform(scrollXProgress, [0, 0.2, 0.5, 0.8, 1], ["blur(4px)", "blur(0px)", "blur(0px)", "blur(0px)", "blur(4px)"]);

  return (
    <motion.div
      ref={cardRef}
      style={{ scale, opacity, x: parallax, filter: blur }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: (index % 10) * 0.1 }}
      whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.3 } }}
      className="flex-shrink-0 w-[420px] p-10 rounded-r2 border border-white/5 bg-c-surface hover:border-c-violet/40 transition-all duration-500 group relative overflow-hidden shadow-sm hover:shadow-[0_40px_100px_rgba(0,0,0,0.6)] will-change-transform"
    >
      {/* Floating Micro-motion */}
      <motion.div
        animate={{ 
          y: [0, -6, 0],
          rotate: [0, 0.5, 0]
        }}
        transition={{
          duration: 4 + (index % 3),
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-c-violet/0 via-c-violet/60 to-c-violet/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map(s => (
            <span key={s} className="text-sm">⭐</span>
          ))}
        </div>
        <p className="text-c-muted mb-8 italic leading-relaxed text-lg font-medium">"{t.quote}"</p>
        <div className="flex items-center gap-4">
          <motion.img 
            whileHover={{ scale: 1.1 }}
            src={`https://i.pravatar.cc/150?u=${t.name}`} 
            className="w-12 h-12 rounded-full border-2 border-white/10 shadow-md" 
            alt={t.name} 
            referrerPolicy="no-referrer" 
          />
          <div>
            <p className="font-bold text-sm text-white">{t.name}</p>
            <p className="text-[11px] font-bold text-c-dim uppercase tracking-widest">{t.role}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Subtle Shadow Breathing */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-10 bg-c-violet/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
};

const Testimonials = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const baseTestimonials = [
    { name: "Sarah Chen", role: "CEO at TechFlow", quote: "HireCode has been a game-changer for our international expansion. The API is a dream to work with." },
    { name: "James Wilson", role: "CTO at PayLater", quote: "We migrated from a legacy provider in less than a week. The documentation is world-class." },
    { name: "Elena Rodriguez", role: "Founder of Artify", quote: "The fraud protection alone saved us thousands in the first month. Highly recommended." },
    { name: "Michael Park", role: "Head of Growth at Streamline", quote: "The onboarding experience was seamless. We were up and running in minutes." },
    { name: "Aisha Khan", role: "Product Manager at GlobalPay", quote: "HireCode's dashboard gives us insights we never had before. It's truly a powerhouse." },
    { name: "David Miller", role: "Founder of EcoStore", quote: "The customer support is top-notch. They really care about our success." },
    { name: "Sophie Martin", role: "Lead Developer at CloudScale", quote: "Integrating HireCode was the best decision we made this year. The SDKs are robust." },
    { name: "Liam O'Connor", role: "CFO at FinTech Solutions", quote: "Our transaction success rate improved by 15% since switching to HireCode." },
    { name: "Yuki Tanaka", role: "CTO at NextGen", quote: "The security features are industry-leading. We feel safe scaling with HireCode." },
    { name: "Chloe Dubois", role: "Founder of Luxe", quote: "HireCode's multi-currency support is essential for our global brand." },
  ];

  // Triple the testimonials for a seamless loop
  const testimonials = [...baseTestimonials, ...baseTestimonials, ...baseTestimonials];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // Start in the middle set for immediate seamless feel
    const singleSetWidth = scrollContainer.scrollWidth / 3;
    scrollContainer.scrollLeft = singleSetWidth;

    let animationFrameId: number;
    const scrollSpeed = 0.6; // Adjusted for premium feel

    const autoScroll = () => {
      if (!isHovered && !isDragging) {
        scrollContainer.scrollLeft += scrollSpeed;
        
        // Seamless loop reset
        if (scrollContainer.scrollLeft >= singleSetWidth * 2) {
          scrollContainer.scrollLeft = singleSetWidth;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  // Handle mouse wheel to horizontal scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <section className="py-32 bg-c-bg overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="tag mb-6 bg-c-violet/10 text-c-violet">Testimonials</div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight flex flex-col gap-1">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="block"
          >
            Trusted by
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30, scale: 1.02 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="block bg-clip-text text-transparent bg-linear-to-r from-c-violet via-c-pink to-c-violet bg-[length:200%_auto] animate-shimmer"
          >
            thousands
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="block"
          >
            of innovative teams
          </motion.span>
        </h2>
      </div>

      <div className="relative group">
        {/* Edge Fades */}
        <div className="absolute inset-y-0 left-0 w-[15%] bg-linear-to-r from-c-bg via-c-bg/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-[15%] bg-linear-to-l from-c-bg via-c-bg/80 to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsDragging(false);
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-10 overflow-x-auto pb-20 px-4 no-scrollbar cursor-grab active:cursor-grabbing select-none will-change-scroll`}
          style={{ scrollBehavior: isDragging ? 'auto' : 'auto' }} // auto for precise drag control
        >
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} t={t} index={i} containerRef={scrollRef} />
          ))}
        </div>
      </div>
    </section>
  );
};

const RecentUpdates = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const observerTarget = useRef(null);

  const loadMoreItems = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const currentPage = pageRef.current;
    const newItems = Array.from({ length: 6 }).map((_, i) => ({
      id: `update-${currentPage}-${i}`,
      title: `Platform Update v${currentPage}.${i + 1}`,
      description: "New features, performance improvements, and bug fixes to help you build faster.",
      date: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
      image: `https://picsum.photos/seed/update${currentPage}${i}/400/250`
    }));

    setItems(prev => [...prev, ...newItems]);
    pageRef.current += 1;
    loadingRef.current = false;
    setLoading(false);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMoreItems]);

  return (
    <section className="py-32 px-6 bg-c-bg border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Latest Updates
          </h2>
          <p className="text-xl text-c-muted max-w-2xl mx-auto leading-relaxed">
            Stay up to date with the latest features and improvements to the HireCode platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (index % 6) * 0.1 }}
              className="group bg-c-surface rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            >
              <div className="h-48 overflow-hidden bg-c-surface2 relative">
                {/* Use loading="lazy" for efficient image loading */}
                <img 
                  src={item.image} 
                  alt={item.title} 
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6">
                <div className="text-xs text-c-violet font-bold mb-3 tracking-wider uppercase">{item.date}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-c-muted text-sm leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div ref={observerTarget} className="h-20 flex items-center justify-center mt-10">
          {loading && (
            <div className="w-8 h-8 border-2 border-c-violet border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>
    </section>
  );
};

const FinalCTA = () => (
  <section className="py-32 px-6 bg-c-surface">
    <div className="max-w-5xl mx-auto bg-c-bg rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-black/50 border border-white/5">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-c-violet rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-c-indigo rounded-full blur-[120px]" />
      </div>
      
      <div className="relative z-10">
        <h2 className="text-4xl md:text-6xl font-black mb-10 tracking-tight leading-tight">
          Ready to start <br /> building?
        </h2>
        <p className="text-xl text-c-muted mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
          Create an account and start accepting payments in minutes. No credit card required to get started.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Button size="lg" variant="primary">
            Create free account
          </Button>
          <Button size="lg" variant="outline">
            Contact sales
          </Button>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="py-24 bg-c-bg px-6 border-t border-white/5">
    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16">
      <div className="col-span-2 lg:col-span-1">
        <div className="mb-8">
          <Logo size="small" />
        </div>
        <p className="text-sm text-c-muted mb-8 leading-relaxed">
          The global standard for financial infrastructure. Built for the modern internet.
        </p>
        <div className="flex gap-5">
          <span className="text-xl text-c-dim hover:text-white cursor-pointer transition-colors">🌐</span>
          <span className="text-xl text-c-dim hover:text-white cursor-pointer transition-colors">⚡</span>
          <span className="text-xl text-c-dim hover:text-white cursor-pointer transition-colors">👥</span>
        </div>
      </div>

      <div>
        <h4 className="font-bold mb-8 text-[11px] uppercase tracking-[0.2em] text-c-dim">Products</h4>
        <ul className="space-y-4 text-[13px] font-medium text-c-muted">
          <li><a href="#" className="hover:text-white transition-colors">Payments</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Billing</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Connect</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Radar</a></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold mb-8 text-[11px] uppercase tracking-[0.2em] text-c-dim">Solutions</h4>
        <ul className="space-y-4 text-[13px] font-medium text-c-muted">
          <li><a href="#" className="hover:text-white transition-colors">Ecommerce</a></li>
          <li><a href="#" className="hover:text-white transition-colors">SaaS</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Marketplaces</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Embedded Finance</a></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold mb-8 text-[11px] uppercase tracking-[0.2em] text-c-dim">Developers</h4>
        <ul className="space-y-4 text-[13px] font-medium text-c-muted">
          <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
          <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
          <li><a href="#" className="hover:text-white transition-colors">API Status</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Libraries</a></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold mb-8 text-[11px] uppercase tracking-[0.2em] text-c-dim">Company</h4>
        <ul className="space-y-4 text-[13px] font-medium text-c-muted">
          <li><a href="#" className="hover:text-white transition-colors">About</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Privacy & Terms</a></li>
        </ul>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-c-dim uppercase tracking-[0.2em]">
      <p>© 2026 HireCode Inc.</p>
      <div className="flex gap-10">
        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
      </div>
    </div>
  </footer>
);

const AuthModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const getFriendlyErrorMessage = (error: any) => {
    const code = error.code || error.message;
    if (code.includes('auth/invalid-credential')) return "Invalid email or password. Please check your credentials and try again.";
    if (code.includes('auth/user-not-found')) return "No account found with this email.";
    if (code.includes('auth/wrong-password')) return "Incorrect password. Please try again.";
    if (code.includes('auth/email-already-in-use')) return "An account already exists with this email.";
    if (code.includes('auth/weak-password')) return "Password is too weak. Please use at least 6 characters.";
    if (code.includes('auth/invalid-email')) return "Please enter a valid email address.";
    if (code.includes('auth/popup-closed-by-user')) return "Sign-in was cancelled.";
    return "An unexpected error occurred. Please try again.";
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: "user",
          onboardingStatus: "not_started",
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignUp && password.length < 8) {
      setError("Password must be at least 8 characters long for security.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with name
        await updateProfile(result.user, {
          displayName: name
        });

        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: name,
          role: "user",
          onboardingStatus: "not_started",
          createdAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-c-bg/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-c-surface border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <Logo />
                <h2 className="text-2xl font-bold text-white mt-6">
                  {isSignUp ? "Create your account" : "Welcome back"}
                </h2>
                <p className="text-c-muted mt-2">
                  {isSignUp ? "Start building with HireCode today." : "Sign in to manage your business."}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 hover:scale-[1.02] transition-all mb-6 disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                  <span className="bg-c-surface px-4 text-c-dim">Or with email</span>
                </div>
              </div>

              {!isSignUp && (
                <p className="text-[11px] text-c-dim mb-6 text-center leading-relaxed">
                  Note: If you usually use Google to sign in, please use the button above. 
                  Your email password is not automatically linked to this field.
                </p>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-[10px] font-bold text-c-dim uppercase tracking-widest mb-2">Full Name</label>
                    <input
                      type="text"
                      required={isSignUp}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-5 py-3.5 bg-c-bg border border-white/10 rounded-xl text-white focus:outline-none focus:border-c-violet transition-all"
                      placeholder="John Doe"
                    />
                  </motion.div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-c-dim uppercase tracking-widest mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-3.5 bg-c-bg border border-white/10 rounded-xl text-white focus:outline-none focus:border-c-violet transition-all"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-c-dim uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-3.5 bg-c-bg border border-white/10 rounded-xl text-white focus:outline-none focus:border-c-violet transition-all pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-lg opacity-50 hover:opacity-100 transition-opacity"
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {isSignUp && (
                    <p className="text-[10px] text-c-dim mt-2">
                      Must be at least 8 characters long.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn bg-c-violet text-white py-4 justify-center text-base disabled:opacity-50 border-none shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:bg-c-violet/80 hover:scale-[1.02] transition-all"
                >
                  {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
                </button>
              </form>

              <p className="text-center mt-8 text-sm text-c-muted">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-c-violet font-bold hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Dashboard = ({ user }: { user: User }) => {
  return (
    <div className="pt-32 pb-24 px-6 min-h-screen bg-c-bg relative overflow-hidden">
      {/* Decorative Floating Elements for Dashboard */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <FloatingCard className="top-[20%] -left-12 opacity-40 scale-75 bg-c-surface border-white/5" delay={2} yOffset={30} duration={7}>
          <div className="w-8 h-8 bg-c-violet/10 rounded-full flex items-center justify-center">
            <span className="text-sm">📈</span>
          </div>
          <p className="text-[9px] font-bold text-c-dim uppercase tracking-widest">Market Up 2.4%</p>
        </FloatingCard>

        <FloatingCard className="bottom-[15%] -right-8 opacity-30 scale-90 bg-c-surface border-white/5" delay={3.5} yOffset={-25} duration={8}>
          <div className="w-8 h-8 bg-c-violet/10 rounded-full flex items-center justify-center">
            <span className="text-sm">⚡</span>
          </div>
          <p className="text-[9px] font-bold text-c-dim uppercase tracking-widest">API Latency: 12ms</p>
        </FloatingCard>

        <FloatingCard className="top-[60%] -right-16 opacity-20 scale-110 bg-c-surface border-white/5" delay={5} yOffset={40} duration={10}>
          <div className="w-10 h-10 bg-c-violet/10 rounded-full flex items-center justify-center">
            <span className="text-sm">🛡️</span>
          </div>
          <p className="text-[9px] font-bold text-c-dim uppercase tracking-widest">Radar Protected</p>
        </FloatingCard>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="tag mb-4 bg-c-violet/10 text-c-violet border-c-violet/20">Merchant Dashboard</div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Welcome back, <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-c-violet relative inline-block"
              >
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                <motion.span
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0, 1, 0],
                    rotate: [0, 45, 90]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="absolute -top-2 -right-4 text-xl"
                >
                  ✨
                </motion.span>
              </motion.span>
            </h1>
          </div>
          <div className="flex gap-4">
            {user.email === "soltaniyasmin111@gmail.com" && (
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, { onboardingStatus: 'approved' });
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-xs font-bold border border-red-500/30 hover:bg-red-500/30 transition-all"
                >
                  Approve
                </button>
                <button 
                  onClick={async () => {
                    const userRef = doc(db, 'users', user.uid);
                    await updateDoc(userRef, { onboardingStatus: 'not_started' });
                  }}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl text-xs font-bold border border-yellow-500/30 hover:bg-yellow-500/30 transition-all"
                >
                  Reset
                </button>
              </div>
            )}
            <button className="btn btn-outline px-6 py-2.5 bg-c-surface border-white/5 hover:bg-white/5 text-white">
              <span>📅</span> Last 30 days
            </button>
            <button className="btn btn-primary px-6 py-2.5 bg-c-violet text-white border-none shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:bg-c-violet/80">
              <span>➕</span> New Payment
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Total Revenue", value: "$124,592.00", change: "+12.5%", icon: "💰" },
            { label: "Active Subscriptions", value: "1,240", change: "+3.2%", icon: "🔄" },
            { label: "Avg. Transaction", value: "$84.20", change: "-0.8%", icon: "📈" },
            { label: "Success Rate", value: "99.98%", change: "+0.02%", icon: "✅" },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-6 bg-c-surface border border-white/5 rounded-2xl hover:border-c-violet/30 hover:shadow-2xl hover:shadow-c-violet/10 transition-all group cursor-default"
            >
              <div className="flex justify-between items-start mb-4">
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                  className="w-10 h-10 bg-c-bg rounded-xl flex items-center justify-center text-xl group-hover:bg-c-violet group-hover:scale-110 transition-all"
                >
                  {stat.icon}
                </motion.div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-c-teal/10 text-c-teal' : 'bg-red-500/10 text-red-400'}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-[10px] font-bold text-c-dim uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-c-surface border border-white/5 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white">Revenue Overview</h3>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-c-dim uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-c-violet" />
                    Gross Volume
                  </div>
                </div>
              </div>
              <div className="h-64 w-full flex items-end justify-between gap-3">
                {[30, 45, 35, 60, 55, 80, 75, 90, 85, 100, 95, 110].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.05 }}
                    className="w-full bg-linear-to-t from-c-violet/20 to-c-violet rounded-t-lg relative group"
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-c-surface border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      ${(h * 120).toLocaleString()}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex justify-between mt-6 text-[10px] font-bold text-c-dim uppercase tracking-widest">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span>Nov</span>
              </div>
            </div>

            <div className="bg-c-surface border border-white/5 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-8">Recent Transactions</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 bg-c-bg/50 rounded-2xl border border-white/5 hover:bg-c-bg transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-c-surface rounded-full flex items-center justify-center border border-white/5">
                        <span className="text-lg">👥</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">Customer #{2400 + i}</p>
                        <p className="text-[11px] text-c-dim">Mar {20 - i}, 2026 • 14:30 PM</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">+${(Math.random() * 500 + 50).toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-c-teal uppercase tracking-widest">Succeeded</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-4 text-sm font-bold text-c-dim hover:text-white transition-colors">
                View all transactions ➡️
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-c-surface border border-white/5 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { label: "Create Invoice", icon: "📄" },
                  { label: "Issue Refund", icon: "↩️" },
                  { label: "Export CSV", icon: "📥" },
                  { label: "API Keys", icon: "🔑" },
                ].map((action, i) => (
                  <motion.button 
                    key={i} 
                    whileHover={{ x: 5, scale: 1.02 }}
                    className="flex items-center gap-4 p-4 bg-c-bg/50 rounded-2xl border border-white/5 hover:bg-c-bg hover:border-white/10 transition-all text-left"
                  >
                    <span className="text-xl">{action.icon}</span>
                    <span className="text-sm font-bold text-white">{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="bg-c-violet rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <h4 className="text-lg font-bold mb-2">Need help?</h4>
                <p className="text-sm text-white/80 mb-6 leading-relaxed">Our support team is available 24/7 to help you with any issues.</p>
                <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // PayPal-style Smooth Scrolling with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        
        // Listen to user document changes
        const userRef = doc(db, 'users', authUser.uid);
        unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // If doc doesn't exist yet, it will be created by AuthModal or first sign-in
            setUserData({ onboardingStatus: 'not_started' });
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        if (unsubscribeDoc) unsubscribeDoc();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-c-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-4xl"
        >
          <span className="text-c-violet">⚡</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans relative">
      <Navbar 
        user={user} 
        onSignInClick={() => setIsAuthModalOpen(true)} 
        onSignOut={handleSignOut}
        onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
      
      {user ? (
        userData?.onboardingStatus === 'approved' ? (
          <Dashboard user={user} />
        ) : (
          <Onboarding 
            user={user} 
            onboardingStatus={userData?.onboardingStatus}
            onComplete={() => {}} 
          />
        )
      ) : (
        <>
          <Hero />
          <LogoCloud />
          <FeaturesSection />
          <ProductDemo />
          <DeveloperSection />
          <UseCases />
          <Pricing />
          <Testimonials />
          <RecentUpdates />
          <ContactSection />
          <FinalCTA />
        </>
      )}
      
      <Footer />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
