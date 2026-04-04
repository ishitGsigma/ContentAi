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
  FaEyeSlash
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
        className="container max-w-md mx-auto flex items-center justify-center min-h-screen"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        <div className="w-full">
          <motion.div
            className="text-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
          >
            <FaRobot className="text-6xl mx-auto mb-4 gradient-text floating" />
            <h1 className="text-4xl font-bold mb-2">ContentAI Studio</h1>
            <p className="text-gray-400">AI-Powered Content Creation</p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={authMode}
              initial={{ opacity: 0, x: authMode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: authMode === "login" ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className="card p-6"
            >
              {authMode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <label className="block text-sm font-medium mb-2 flex items-center">
                    <FaUser className="mr-2" /> Name
                  </label>
                  <input
                    className="w-full"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </motion.div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <FaEnvelope className="mr-2" /> Email
                </label>
                <input
                  className="w-full"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <FaLock className="mr-2" /> Password
                </label>
                <div className="relative">
                  <input
                    className="w-full pr-10"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {authErr && (
                <motion.p
                  className="text-red-400 mb-4 text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {authErr}
                </motion.p>
              )}

              <motion.button
                className="w-full mb-4"
                onClick={authMode === "login" ? doLogin : doRegister}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {authMode === "login" ? "Login" : "Create Account"}
              </motion.button>

              <motion.button
                className="w-full bg-transparent border border-gray-600 hover:border-gray-400"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthErr("");
                  setName("");
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Switch to {authMode === "login" ? "Register" : "Login"}
              </motion.button>
            </motion.div>
          </AnimatePresence>
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
            <p className="text-gray-400">Credits: {isAdmin ? "Unlimited" : user?.credits}</p>
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
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center">
                  <FaMagic className="mr-2" /> Content Type
                </label>
                <select
                  className="w-full"
                  value={tool}
                  onChange={(e) => setTool(e.target.value)}
                >
                  {TOOLS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-400 mt-2">
                  {TOOLS.find(t => t.id === tool)?.desc}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 flex items-center">
                  <FaMagic className="mr-2" /> Topic
                </label>
                <input
                  className="w-full"
                  placeholder="Enter your topic..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Additional Details</label>
                <textarea
                  className="w-full"
                  rows={4}
                  placeholder="Any specific requirements or context..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </div>

              <motion.button
                className="w-full flex items-center justify-center"
                onClick={doGenerate}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <div className="loading mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <FaRocket className="mr-2" />
                    Generate Content
                  </>
                )}
              </motion.button>

              {genErr && (
                <motion.p
                  className="text-red-400 text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {genErr}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Generated Content</label>
              <motion.pre
                className="w-full min-h-96 p-4 rounded-lg bg-gray-800 border border-gray-600 overflow-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {output || "Your generated content will appear here..."}
              </motion.pre>
            </div>
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

