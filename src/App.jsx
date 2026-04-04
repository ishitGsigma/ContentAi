import { useEffect, useState } from "react";

const ADMIN_EMAIL = "admin@contentai.com";
const ADMIN_PASSWORD = "Admin@123";
const FREE_CREDITS = 3;

const PACKAGES = [
  { id: "starter", label: "Starter", credits: 10, price: 99 },
  { id: "pro", label: "Pro", credits: 30, price: 249, popular: true },
  { id: "business", label: "Business", credits: 75, price: 499 },
];

const TOOLS = [
  { id: "social", label: "Social media post", desc: "Instagram · Twitter · LinkedIn" },
  { id: "blog", label: "Blog article", desc: "Outline with intro, sections, CTA" },
  { id: "email", label: "Email campaign", desc: "Subject, body, CTA" },
  { id: "ad", label: "Ad copy", desc: "Google & Meta variations" },
  { id: "youtube", label: "YouTube script", desc: "Hook, content, outro" },
  { id: "product", label: "Product description", desc: "E-commerce listings" },
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
        throw new Error(data.error || "Generation failed.");
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
      setGenErr(error.message || "Generation failed. Check your API key.");
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

  if (page === "auth") {
    return (
      <div className="container max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">ContentAI Studio</h1>
        {authMode === "register" && (
          <input
            className="w-full border p-2 mb-2"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className="w-full border p-2 mb-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2 mb-2"
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {authErr && <p className="text-red-600 mb-2">{authErr}</p>}
        <button
          className="border px-4 py-2 mr-2"
          onClick={authMode === "login" ? doLogin : doRegister}
        >
          {authMode === "login" ? "Login" : "Register"}
        </button>
        <button
          className="border px-4 py-2"
          onClick={() => {
            setAuthMode(authMode === "login" ? "register" : "login");
            setAuthErr("");
          }}
        >
          Switch to {authMode === "login" ? "Register" : "Login"}
        </button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Welcome {user?.name}</h1>
      <p className="mb-4">Credits: {isAdmin ? "Unlimited" : user?.credits}</p>

      <div className="mb-4 space-x-2">
        <button className="border px-3 py-2" onClick={() => setTab("generate")}>Generate</button>
        <button className="border px-3 py-2" onClick={() => setTab("credits")}>Buy Credits</button>
        {isAdmin && (
          <button className="border px-3 py-2" onClick={() => setTab("admin")}>Admin</button>
        )}
        <button
          className="border px-3 py-2"
          onClick={() => {
            setUser(null);
            setPage("auth");
          }}
        >
          Logout
        </button>
      </div>

      {tab === "generate" && (
        <div>
          <select
            className="w-full border p-2 mb-2"
            value={tool}
            onChange={(e) => setTool(e.target.value)}
          >
            {TOOLS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            className="w-full border p-2 mb-2"
            placeholder="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <textarea
            className="w-full border p-2 mb-2"
            rows={4}
            placeholder="Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <button className="border px-4 py-2" onClick={doGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </button>
          {genErr && <p className="text-red-600 mt-2">{genErr}</p>}
          {output && <pre className="mt-4 whitespace-pre-wrap border p-4">{output}</pre>}
        </div>
      )}

      {tab === "credits" && (
        <div className="grid grid-cols-3 gap-4">
          {PACKAGES.map((pkg) => (
            <div key={pkg.id} className="border p-4 rounded card">
              <h3 className="font-bold">{pkg.label}</h3>
              <p>₹{pkg.price}</p>
              <p>{pkg.credits} credits</p>
              <button className="border px-3 py-2 mt-2" onClick={() => buyCredits(pkg)} disabled={paymentLoading}>
                {paymentLoading ? "Processing..." : "Buy"}
              </button>
            </div>
          ))}
        </div>
      )}
      {paymentErr && <p className="text-red-600 mt-2">{paymentErr}</p>}

      {tab === "admin" && isAdmin && (
        <div>
          <h2 className="text-xl font-bold mb-2">Users</h2>
          {Object.values(allUsers).map((u) => (
            <div key={u.email} className="border p-3 mb-2 rounded card">
              <p>{u.name}</p>
              <p>{u.email}</p>
              <p>Credits: {u.credits}</p>
              <p>Generations: {u.gens}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

