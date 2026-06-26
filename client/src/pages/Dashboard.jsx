import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  FileText, Upload, LogOut, Search,
  AlertTriangle, CheckCircle, Clock, Trash2, Crown, GitCompare,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await API.get("/documents");
      setDocuments(data);
    } catch (err) {
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files allowed");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    setUploading(true);
    toast.loading("Analyzing document with AI...", { id: "upload" });

    try {
      const { data } = await API.post("/documents/upload", formData);
      setDocuments([data, ...documents]);
      toast.success("Document analyzed successfully!", { id: "upload" });
    } catch (err) {
      toast.error("Upload failed", { id: "upload" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/documents/${id}`);
      setDocuments(documents.filter((d) => d._id !== id));
      toast.success("Document deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRiskColor = (level) => {
    if (level === "High") return "text-red-600 bg-red-50 border-red-200";
    if (level === "Medium") return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getRiskIcon = (level) => {
    if (level === "High") return <AlertTriangle className="w-4 h-4" />;
    if (level === "Medium") return <Clock className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const filtered = documents.filter((d) =>
    d.fileName.toLowerCase().includes(search.toLowerCase())
  );

  const highRisk = documents.filter((d) => d.riskLevel === "High").length;
  const mediumRisk = documents.filter((d) => d.riskLevel === "Medium").length;
  const lowRisk = documents.filter((d) => d.riskLevel === "Low").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Legal Analyzer</h1>
              <p className="text-xs text-gray-500">AI-Powered Contract Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
  <span className="text-sm text-gray-600">
    Hello, {user?.name}
  </span>
  <button
    onClick={() => navigate("/compare")}
    className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition text-sm"
    >
    <GitCompare className="w-4 h-4" />
    Compare
  </button>

  {!user?.isPremium && (
    <button
      onClick={() => navigate("/pricing")}
      className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold px-4 py-1.5 rounded-lg text-sm transition"
    >
      <Crown className="w-4 h-4" />
      Upgrade
    </button>
  )}

  {user?.isPremium && (
    <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
      <Crown className="w-3 h-3" />
      PREMIUM
    </span>
  )}

  <button
    onClick={handleLogout}
    className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition text-sm"
  >
    <LogOut className="w-4 h-4" />
    Logout
  </button>
</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Documents</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{documents.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-red-200 shadow-sm">
            <p className="text-sm text-red-500">High Risk</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{highRisk}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-yellow-200 shadow-sm">
            <p className="text-sm text-yellow-500">Medium Risk</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{mediumRisk}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
            <p className="text-sm text-green-500">Low Risk</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{lowRisk}</p>
          </div>
        </div>

        {documents.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Risk Score Trends</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[...documents].reverse().map((d) => ({
              name: d.fileName.substring(0, 15) + "...",
              score: d.riskScore,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

        {/* Upload + Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg cursor-pointer transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload className="w-4 h-4" />
            {uploading ? "Analyzing..." : "Upload PDF"}
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading documents...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">No documents yet</h3>
            <p className="text-gray-400 mt-2">Upload a PDF to get AI-powered legal analysis</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <div
                key={doc._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-5 cursor-pointer"
                onClick={() => navigate(`/document/${doc._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-800 text-sm truncate max-w-[150px]">
                      {doc.fileName}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc._id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-gray-500 text-xs mb-4 line-clamp-2">{doc.summary}</p>

                <div className="flex items-center justify-between">
                  <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${getRiskColor(doc.riskLevel)}`}>
                    {getRiskIcon(doc.riskLevel)}
                    {doc.riskLevel} Risk
                  </span>
                  <span className="text-xs text-gray-400">
                    Score: {doc.riskScore}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}