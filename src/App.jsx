import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaRobot,
  FaCreditCard,
  FaUserCog,
  FaSignOutAlt,
  FaMagic,
  FaRocket,
  FaBrain,
  FaPalette,
  FaVideo,
  FaShoppingCart,
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaDownload,
  FaImage,
  FaLink,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCoins,
  FaInfinity,
  FaThumbsUp,
  FaThumbsDown,
  FaMeh
} from "react-icons/fa";

const ADMIN_EMAIL = "admin@contentai.com";
const ADMIN_PASSWORD = "Admin@123";
const FREE_CREDITS = 3;

const PACKAGES = [
  { id: "starter", label: "Starter", credits: 10, price: 99, icon: FaMagic, color: "from-blue-500 to-purple-600" },
  { id: "pro", label: "Pro", credits: 30, price: 249, popular: true, icon: FaRocket, color: "from-purple-500 to-pink-600" },
  { id: "business", label: "Business", credits: 75, price: 499, icon: FaBrain, color: "from-pink-500 to-red-600" },
];

const TOOLS = [
  { id: "social", label: "Social media post", desc: "Instagram · Twitter · LinkedIn", icon: FaPalette },
  { id: "blog", label: "Blog article", desc: "Outline with intro, sections, CTA", icon: FaMagic },
  { id: "email", label: "Email campaign", desc: "Subject, body, CTA", icon: FaEnvelope },
  { id: "ad", label: "Ad copy", desc: "Google & Meta variations", icon: FaShoppingCart },
  { id: "youtube", label: "YouTube script", desc: "Hook, content, outro", icon: FaVideo },
  { id: "product", label: "Product description", desc: "E-commerce listings", icon: FaShoppingCart },
];

const MOTION_ITEMS = [
  { id: 'item-a', top: '14%', left: '12%', size: 12, delay: 0, color: '#70e3ff' },
  { id: 'item-b', top: '24%', left: '75%', size: 14, delay: 0.15, color: '#c065ff' },
  { id: 'item-c', top: '68%', left: '20%', size: 10, delay: 0.28, color: '#75ffd3' },
  { id: 'item-d', top: '58%', left: '82%', size: 16, delay: 0.05, color: '#86b0ff' },
  { id: 'item-e', top: '42%', left: '46%', size: 10, delay: 0.22, color: '#f36cff' },
];

const buildPrompt = (tool, topic, details) => {
  const ctx = details ? ` Additional context: ${details}` : "";
  const map = {
    social: `Create 3 distinct social media posts for "${topic}".${ctx}\n\nFormat for Instagram, X, and LinkedIn.`,
    blog: `Write a detailed blog article outline for "${topic}".${ctx}`,
    email: `Write a complete marketing email for "${topic}".${ctx}`,
    ad: `Write 3 ad copy variations for "${topic}".${ctx}`,
    youtube: `Write a YouTube video script for "${topic}".${ctx}`,
    product: `Write a compelling product listing for "${topic}".${ctx}`,
  };
  return map[tool] || map.social;
};

const loadUsers = () => {
  try {
    return JSON.parse(localStorage.getItem("_cai_users") || "{}");
  } catch {
    return {};
  }
};

const saveUsers = (db) => {
  localStorage.setItem("_cai_users", JSON.stringify(db));
};

function parseContent(text) {
  if (!text) return { content: "", links: [], imageSuggestions: [] };

  const links = [];
  const imageSuggestions = [];

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let linkIndex = 0;
  const contentWithLinks = text.replace(urlRegex, (match) => {
    links.push(match);
    return `__LINK_${linkIndex++}__`;
  });

  const imageRegex = /(?:create|generate|design|make)\s+(?:an?\s+)?(?:image|picture|photo|graphic|illustration|banner|thumbnail|logo)(?:\s+of|\s+for|\s+showing|\s+with|\s+that|\s+depicting)?\s*([^.!?\n]*)/gi;
  let match;
  while ((match = imageRegex.exec(text)) !== null) {
    const suggestion = match[0].trim();
    if (suggestion.length > 10) {
      imageSuggestions.push(suggestion);
    }
  }

  return { content: contentWithLinks, links, imageSuggestions };
}

const ContentDisplay = ({ text }) => {
  const { content, links } = parseContent(text);

  const renderContent = () => {
    const parts = content.split(/(__LINK_\d+__)/);
    return parts.map((part, index) => {
      const linkMatch = part.match(/__LINK_(\d+)__/);
      if (linkMatch) {
        const linkIndex = parseInt(linkMatch[1], 10);
        const url = links[linkIndex];
        return (
          <motion.a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-blue-300 hover:text-blue-200 transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaLink className="mr-1 text-xs" />
            {url.length > 50 ? `${url.substring(0, 47)}...` : url}
          </motion.a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="whitespace-pre-wrap text-gray-100 leading-relaxed">
      {renderContent()}
    </div>
  );
};

export default function App() {
  const [page, setPage] = useState("auth");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState({});
  const [tab, setTab] = useState("generate");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authErr, setAuthErr] = useState("");

  const [tool, setTool] = useState("social");
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [genErr, setGenErr] = useState("");
  const [paymentErr, setPaymentErr] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [copied, setCopied] = useState(false);
  const [imageSuggestions, setImageSuggestions] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImagePrompt, setSelectedImagePrompt] = useState("");
  const [imageGenerating, setImageGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const db = loadUsers();
    setAllUsers(db);

    const saved = localStorage.getItem("_cai_current_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          setUser(parsed);
          setPage("app");
        }
      } catch {
        localStorage.removeItem("_cai_current_user");
      }
    }
  }, []);

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      localStorage.setItem("_cai_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("_cai_current_user");
    }
  }, [user]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const doRegister = () => {
    const key = email.toLowerCase().trim();
    if (!name.trim() || !key || !pw) {
      setAuthErr("Please fill all registration fields.");
      return;
    }

    const db = loadUsers();
    if (db[key]) {
      setAuthErr("Email already exists");
      return;
    }

    const newUser = {
      name: name.trim(),
      email: key,
      pw,
      credits: FREE_CREDITS,
      gens: 0,
      joined: Date.now(),
    };

    db[key] = newUser;
    saveUsers(db);
    setAllUsers(db);
    setUser(newUser);
    setPage("app");
    setAuthErr("");
  };

  const doLogin = () => {
    const key = email.toLowerCase().trim();
    if (key === ADMIN_EMAIL && pw === ADMIN_PASSWORD) {
      setUser({ name: "Admin", email: ADMIN_EMAIL, credits: Infinity });
      setPage("app");
      setAuthErr("");
      return;
    }

    const db = loadUsers();
    const found = db[key];
    if (!found || found.pw !== pw) {
      setAuthErr("Invalid credentials");
      return;
    }

    setUser(found);
    setPage("app");
    setAuthErr("");
  };

  const doGenerate = async () => {
    if (!topic.trim()) {
      setGenErr("Enter a topic first");
      return;
    }
    if (!isAdmin && user.credits <= 0) {
      setGenErr("No credits left");
      return;
    }

    setLoading(true);
    setGenErr("");
    setOutput("");
    setImageSuggestions([]);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tool, topic, details }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || JSON.stringify(data) || "Generation failed.");
      }

      const text = data.text || "";
      if (!text) {
        throw new Error("Empty response from generation service.");
      }

      setOutput(text);

      // Parse content for image suggestions
      const { imageSuggestions: suggestions } = parseContent(text);
      setImageSuggestions(suggestions);

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!isAdmin) {
        const updated = {
          ...user,
          credits: user.credits - 1,
          gens: (user.gens || 0) + 1,
        };

        const db = loadUsers();
        db[user.email] = updated;
        saveUsers(db);
        setAllUsers(db);
        setUser(updated);
      }
    } catch (error) {
      console.error(error);
      const msg = error?.message || String(error) || "Generation failed. Check your API key.";
      setGenErr(msg);
      clearInterval(progressInterval);
      setGenerationProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const buyCredits = async (pkg) => {
    if (!user || isAdmin) return;

    setPaymentErr("");
    setPaymentLoading(true);

    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create payment order.");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout failed to load.");
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "ContentAI Studio",
        description: `${data.label} credits`,
        prefill: {
          email: user.email,
          name: user.name,
        },
        handler: async (resp) => {
          try {
            const verify = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
              }),
            });

            const result = await verify.json();
            if (!verify.ok) {
              throw new Error(result.error || "Payment verification failed.");
            }

            const updated = {
              ...user,
              credits: (user.credits || 0) + pkg.credits,
            };
            const db = loadUsers();
            db[user.email] = updated;
            saveUsers(db);
            setAllUsers(db);
            setUser(updated);
            setTab("generate");
          } catch (verifyError) {
            console.error(verifyError);
            setPaymentErr(verifyError.message || "Payment verification failed.");
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      setPaymentErr(error.message || "Unable to start payment.");
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output);
      addNotification("Content copied to clipboard!", "success");
    } catch (err) {
      console.error('Failed to copy:', err);
      addNotification("Failed to copy to clipboard", "error");
    }
  };

  const addNotification = (message, type = "info") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const downloadAsText = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${tool}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const submitFeedback = async () => {
    addNotification("Feedback is disabled for this workspace.", "info");
  };

  function parseContent(text) {
    if (!text) return { content: "", links: [], imageSuggestions: [] };

    const links = [];
    const imageSuggestions = [];

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let linkIndex = 0;
    const contentWithLinks = text.replace(urlRegex, (match) => {
      links.push(match);
      return `__LINK_${linkIndex++}__`;
    });

    const imageRegex = /(?:create|generate|design|make)\s+(?:an?\s+)?(?:image|picture|photo|graphic|illustration|banner|thumbnail|logo)(?:\s+of|\s+for|\s+showing|\s+with|\s+that|\s+depicting)?\s*([^.!?\n]*)/gi;
    let match;
    while ((match = imageRegex.exec(text)) !== null) {
      const suggestion = match[0].trim();
      if (suggestion.length > 10) {
        imageSuggestions.push(suggestion);
      }
    }

    return { content: contentWithLinks, links, imageSuggestions };
  }

  const generateImage = async (prompt) => {
    setImageGenerating(true);
    setSelectedImagePrompt(prompt);
    // Here you would integrate with an image generation API like DALL-E, Midjourney, etc.
    // For now, we'll just show a placeholder
    setTimeout(() => {
      setImageGenerating(false);
      alert(`Image generation feature would create an image for: "${prompt}"\n\nThis would integrate with services like DALL-E, Midjourney, or Stable Diffusion.`);
    }, 2000);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  if (page === "auth") {
    return (
      <motion.div
        className="container max-w-6xl mx-auto auth-shell"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <div className="auth-layout">
          <motion.div
            className="auth-panel auth-hero-panel"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
          >
            <div className="auth-badge">ContentAI Studio</div>
            <div className="auth-hero-copy">
              <div className="hero-eyebrow">Welcome to your signature AI studio</div>
              <h1 className="auth-hero-title">ContentAI Studio</h1>
              <p className="auth-hero-description">
                Launch mind-bending content in seconds with the most immersive AI workspace.
                Designed for creators, marketers, and founders who want impact from day one.
              </p>
            </div>
            <div className="hero-feature-grid">
              <div>
                <span>01</span>
                <p>Lightning-fast content workflows</p>
              </div>
              <div>
                <span>02</span>
                <p>Polished output with pro prompts</p>
              </div>
              <div>
                <span>03</span>
                <p>Smart credit tracking and client-ready copy</p>
              </div>
            </div>
            <div className="auth-footer-note">
              Built by <strong>ISHIT GOVIL</strong> with an obsession for next-level interface motion.
            </div>
          </motion.div>

          <motion.div
            className="auth-panel auth-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="auth-card-header">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-blue-300">ContentAI Studio</p>
                <h2 className="text-3xl font-bold mt-2">{authMode === "login" ? "Welcome back" : "Create your studio"}</h2>
              </div>
              <div className="card-tag">Fast | Creative | Smart</div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, y: authMode === "login" ? -10 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: authMode === "login" ? 10 : -10 }}
                transition={{ duration: 0.25 }}
              >
                {authMode === "register" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5"
                  >
                    <label className="input-label">Name</label>
                    <div className="input-group">
                      <FaUser className="input-icon" />
                      <input
                        className="input-field"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}

                <div className="mb-5">
                  <label className="input-label">Email</label>
                  <div className="input-group">
                    <FaEnvelope className="input-icon" />
                    <input
                      className="input-field"
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="input-label">Password</label>
                  <div className="input-group">
                    <FaLock className="input-icon" />
                    <input
                      className="input-field pr-12"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {authErr && (
                  <motion.p
                    className="error-note"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {authErr}
                  </motion.p>
                )}

                <motion.button
                  className="w-full mb-4 auth-action-button"
                  onClick={authMode === "login" ? doLogin : doRegister}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {authMode === "login" ? "Login to Studio" : "Create Account"}
                </motion.button>

                <motion.button
                  className="w-full auth-secondary-button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setAuthErr("");
                    setName("");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {authMode === "login" ? "Join now" : "Already have an account?"}
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="container max-w-6xl mx-auto"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {/* Notification System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`p-4 rounded-lg shadow-lg max-w-sm ${
                notification.type === 'success' ? 'bg-green-600' :
                notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              <div className="flex items-center">
                {notification.type === 'success' && <FaCheck className="mr-2" />}
                {notification.type === 'error' && <FaExclamationTriangle className="mr-2" />}
                {notification.type === 'info' && <FaInfoCircle className="mr-2" />}
                <span>{notification.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center">
          <FaRobot className="text-3xl mr-3 gradient-text" />
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
            <div className="flex items-center mt-1">
              <FaCoins className="text-yellow-400 mr-2 text-lg" />
              {isAdmin ? (
                <FaInfinity className="text-purple-400 text-xl animate-pulse" />
              ) : (
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(user?.credits || 0, 5) }, (_, i) => (
                    <FaCoins key={i} className="text-yellow-400 text-sm" />
                  ))}
                  {user?.credits > 5 && <span className="text-gray-400 ml-1">+{user.credits - 5}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
        <motion.button
          className="flex items-center bg-red-600 hover:bg-red-700"
          onClick={() => {
            setUser(null);
            setPage("auth");
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaSignOutAlt className="mr-2" /> Logout
        </motion.button>
      </motion.div>

      <motion.div
        className="flex space-x-4 mb-8 overflow-x-auto pb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { id: "generate", label: "Generate", icon: FaMagic },
          { id: "credits", label: "Buy Credits", icon: FaCreditCard },
          ...(isAdmin ? [{ id: "admin", label: "Admin", icon: FaUserCog }] : [])
        ].map((item) => (
          <motion.button
            key={item.id}
            className={`flex items-center px-6 py-3 rounded-lg whitespace-nowrap ${
              tab === item.id ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            onClick={() => setTab(item.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <item.icon className="mr-2" />
            {item.label}
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === "generate" && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            className="generate-grid motion-frame"
          >
            <div className="motion-frame-border" />
            {MOTION_ITEMS.map((item) => (
              <motion.div
                key={item.id}
                className="motion-frame-item"
                style={{ top: item.top, left: item.left, width: item.size, height: item.size, background: item.color }}
                animate={{
                  x: [0, 16, -10, 0],
                  y: [0, -12, 10, 0],
                  rotate: [0, 8, -6, 0]
                }}
                transition={{ duration: 6 + item.delay * 3, delay: item.delay, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              />
            ))}

            <motion.div
              className="glass-panel create-shell"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow-text">AI Command Console</p>
                  <h2 className="panel-title">Dark mode content engine</h2>
                  <p className="panel-description">
                    Build polished narratives with a premium studio feel, live prompt tuning, and distortion motion.
                  </p>
                </div>
                <span className="neon-pill">ISHIT GOVIL</span>
              </div>

              <div className="holo-grid">
                <motion.div className="holo-card" whileHover={{ y: -8 }} whileTap={{ scale: 0.98 }}>
                  <span>01</span>
                  <h3>Immersive dashboard</h3>
                  <p>Every prompt and result lives inside a polished, interactive command center.</p>
                </motion.div>
                <motion.div className="holo-card" whileHover={{ y: -8 }} whileTap={{ scale: 0.98 }} transition={{ delay: 0.05 }}>
                  <span>02</span>
                  <h3>Distortion vibe</h3>
                  <p>Animated edges, glass layers, and subtle glow create cinematic motion around your workflow.</p>
                </motion.div>
                <motion.div className="holo-card" whileHover={{ y: -8 }} whileTap={{ scale: 0.98 }} transition={{ delay: 0.1 }}>
                  <span>03</span>
                  <h3>Fast feedback</h3>
                  <p>Live progress, prompt clarity meters, and instant editing keep the workflow powerful.</p>
                </motion.div>
              </div>

              <motion.div
                className="form-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.38 }}
              >
                <div className="stage-strip">
                  <div>
                    <p className="eyebrow-text">Step 1 · Choose your mode</p>
                    <h3>Pick a content style</h3>
                  </div>
                  <div className="status-pill">Distortion Live</div>
                </div>

                <div className="tool-pills">
                  {TOOLS.map((t) => (
                    <motion.button
                      type="button"
                      key={t.id}
                      className={`tool-pill ${tool === t.id ? "active" : ""}`}
                      onClick={() => setTool(t.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <t.icon className="pill-icon" />
                      <div>
                        <span>{t.label}</span>
                        <p>{t.desc}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="form-section blur-card"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.38 }}
              >
                <label className="input-label">Topic</label>
                <input
                  className="input-field"
                  placeholder="Enter your creative brief..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value.slice(0, 100))}
                  maxLength={100}
                />

                <label className="input-label">Prompt details</label>
                <textarea
                  className="input-field textarea"
                  rows={5}
                  placeholder="Mention audience, tone, or any must-have elements..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                  maxLength={500}
                />

                <div className="meter-row">
                  <div className="text-sm text-gray-400">Clarity</div>
                  <div className="meter-strip">
                    <div
                      className="meter-fill"
                      style={{ width: `${Math.min(Math.max(topic.length * 2, 20), 100)}%` }}
                    />
                  </div>
                </div>

                <motion.button
                  className="generate-button"
                  onClick={doGenerate}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <>
                      <div className="loading mr-2"></div>
                      Generating... {generationProgress}%
                    </>
                  ) : (
                    <>
                      <FaRocket className="mr-2" />
                      Generate content with distortion flow
                    </>
                  )}
                </motion.button>

                <motion.button
                  className="auth-secondary-button mt-4"
                  onClick={() => {
                    setTopic("");
                    setDetails("");
                    setTool("social");
                    setOutput("");
                    setImageSuggestions([]);
                    setGenErr("");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Clear form"
                >
                  <FaMagic className="mr-2" /> Reset workspace
                </motion.button>

                {genErr && (
                  <motion.p
                    className="text-red-400 text-center mt-3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {genErr}
                  </motion.p>
                )}
              </motion.div>
            </motion.div>

            <motion.div
              className="glass-panel output-shell"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="panel-header mini">
                <div>
                  <p className="eyebrow-text">Step 2 · Output preview</p>
                  <h3>Interactive content canvas</h3>
                </div>
                <div className="mini-stats">
                  <div>Credits left: {isAdmin ? "∞" : user?.credits}</div>
                  <div>Prompt power: {Math.min(Math.max(topic.length * 2, 20), 100)}%</div>
                </div>
              </div>

              <motion.div
                className="output-console"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.16, duration: 0.35 }}
              >
                {output ? (
                  <div className="space-y-5">
                    <ContentDisplay text={output} />
                    {imageSuggestions.length > 0 && (
                      <motion.div
                        className="mt-4 p-4 bg-white/5 border border-blue-500/15 rounded-2xl"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center gap-2 mb-3 text-blue-200">
                          <FaImage className="text-xl" />
                          <span className="font-semibold">Image idea suggestions</span>
                        </div>
                        <div className="space-y-3">
                          {imageSuggestions.map((suggestion, index) => (
                            <motion.div
                              key={index}
                              className="flex items-center justify-between p-3 bg-[#081523] rounded-2xl border border-white/10"
                              initial={{ opacity: 0, x: -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.08 }}
                            >
                              <span className="text-sm text-gray-300 flex-1 mr-3">{suggestion}</span>
                              <motion.button
                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full text-sm"
                                onClick={() => generateImage(suggestion)}
                                disabled={imageGenerating}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {imageGenerating && selectedImagePrompt === suggestion ? (
                                  <>
                                    <div className="loading"></div>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <FaImage /> Create
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                  </div>
                ) : (
                  <div className="output-placeholder">
                    <motion.div
                      initial={{ rotate: -10, scale: 0.85, opacity: 0 }}
                      animate={{ rotate: 0, scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <FaMagic className="text-6xl" />
                    </motion.div>
                    <h3 className="text-xl font-semibold">Everything starts with a spark</h3>
                    <p className="max-w-xs">
                      Share your topic and details, then fire up the generator to reveal the distortion-driven content experience.
                    </p>
                  </div>
                )}
              </motion.div>

              {output && (
                <div className="action-strip">
                  <motion.button
                    className="flex items-center justify-center bg-gradient-to-r from-sky-500 to-violet-600 rounded-xl px-4 py-3"
                    onClick={copyToClipboard}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FaCopy className="mr-2" /> Copy text
                  </motion.button>
                  <motion.button
                    className="flex items-center justify-center bg-gray-800/90 border border-white/10 rounded-xl px-4 py-3"
                    onClick={downloadAsText}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <FaDownload className="mr-2" /> Download story
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {tab === "credits" && (
          <motion.div
            key="credits"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Plan</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {PACKAGES.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  className={`card p-6 text-center relative ${pkg.popular ? 'ring-2 ring-purple-500' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <pkg.icon className="text-4xl mx-auto mb-4 gradient-text" />
                  <h3 className="text-xl font-bold mb-2">{pkg.label}</h3>
                  <p className="text-3xl font-bold mb-2">₹{pkg.price}</p>
                  <p className="text-gray-400 mb-4">{pkg.credits} credits</p>
                  <motion.button
                    className={`w-full bg-gradient-to-r ${pkg.color}`}
                    onClick={() => buyCredits(pkg)}
                    disabled={paymentLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {paymentLoading ? "Processing..." : "Buy Now"}
                  </motion.button>
                </motion.div>
              ))}
            </div>
            {paymentErr && (
              <motion.p
                className="text-red-400 text-center mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {paymentErr}
              </motion.p>
            )}
          </motion.div>
        )}

        {tab === "admin" && isAdmin && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">User Management</h2>
            <div className="grid gap-4">
              {Object.values(allUsers).map((u, index) => (
                <motion.div
                  key={u.email}
                  className="card p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-gray-400">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Credits: {u.credits}</p>
                      <p className="text-sm text-gray-400">Generations: {u.gens || 0}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

