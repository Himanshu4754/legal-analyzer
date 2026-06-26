import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";
import { Check, X, Zap, FileText } from "lucide-react";

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post("/stripe/create-checkout-session");
      window.location.href = data.url;
    } catch (err) {
      toast.error("Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  const free = [
    { text: "3 document analyses", included: true },
    { text: "Risk score & level", included: true },
    { text: "Basic clause detection", included: true },
    { text: "AI document summary", included: true },
    { text: "PDF report download", included: false },
    { text: "Compare documents", included: false },
    { text: "Chat history", included: false },
    { text: "Unlimited documents", included: false },
  ];

  const premium = [
    { text: "Unlimited document analyses", included: true },
    { text: "Risk score & level", included: true },
    { text: "Advanced clause detection", included: true },
    { text: "AI document summary", included: true },
    { text: "PDF report download", included: true },
    { text: "Compare two documents", included: true },
    { text: "Persistent chat history", included: true },
    { text: "Risk trend analytics", included: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-slate-400 text-lg">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gray-100 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Free</h2>
                <p className="text-gray-500 text-sm">Get started</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">₹0</span>
              <span className="text-gray-500">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {free.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  {item.included ? (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${item.included ? "text-gray-700" : "text-gray-400"}`}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-blue-600 rounded-2xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
              POPULAR
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Premium</h2>
                <p className="text-blue-200 text-sm">Full access</p>
              </div>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-white">₹499</span>
              <span className="text-blue-200">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {premium.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-200 flex-shrink-0" />
                  <span className="text-sm text-white">{item.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading || user?.isPremium}
              className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition disabled:opacity-50"
            >
              {user?.isPremium
                ? "Already Premium ✓"
                : loading
                ? "Redirecting..."
                : "Upgrade to Premium"}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Secure payments powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}