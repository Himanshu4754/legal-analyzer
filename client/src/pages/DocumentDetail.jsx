import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Shield,
  Download,
} from "lucide-react";

import { generateReport } from "../utils/generateReport";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const { data } = await API.get(`/documents/${id}`);
      setDoc(data);
    } catch (err) {
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    try {
      const { data } = await API.post(`/documents/${id}/ask`, { question });
      setAnswer(data.answer);
    } catch (err) {
      toast.error("Failed to get answer");
    } finally {
      setAsking(false);
    }
  };

  const getRiskColor = (level) => {
    if (level === "High") return "text-red-600 bg-red-50 border-red-200";
    if (level === "Medium") return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getClauseColor = (risk) => {
    if (risk === "high") return "border-l-red-500 bg-red-50";
    if (risk === "medium") return "border-l-yellow-500 bg-yellow-50";
    return "border-l-green-500 bg-green-50";
  };

  const getRiskIcon = (level) => {
    if (level === "High") return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (level === "Medium") return <Clock className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading analysis...</div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Document not found</div>
      </div>
    );
  }

  const chartData = [{ name: "Risk", value: doc.riskScore, fill: doc.riskLevel === "High" ? "#ef4444" : doc.riskLevel === "Medium" ? "#f59e0b" : "#22c55e" }];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h1 className="font-semibold text-gray-800 truncate">{doc.fileName}</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Summary */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Document Summary</h2>
              <p className="text-gray-600 leading-relaxed">{doc.summary}</p>
            </div>

            {/* Key Points */}
            {doc.keyPoints && doc.keyPoints.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Key Points</h2>
                <ul className="space-y-2">
                  {doc.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risky Clauses */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Risky Clauses {doc.riskyClauses?.length > 0 && `(${doc.riskyClauses.length})`}
              </h2>
              {doc.riskyClauses && doc.riskyClauses.length > 0 ? (
                <div className="space-y-3">
                  {doc.riskyClauses.map((clause, i) => (
                    <div key={i} className={`border-l-4 rounded-r-lg p-4 ${getClauseColor(clause.risk)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${clause.risk === "high" ? "bg-red-100 text-red-700" : clause.risk === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {clause.risk} risk
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm font-medium mb-1">{clause.text}</p>
                      <p className="text-gray-500 text-xs">{clause.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>No risky clauses detected</span>
                </div>
              )}
            </div>

            {/* Ask AI */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ask AI About This Document</h2>
              <form onSubmit={handleAsk} className="flex gap-3">
                <input
                  type="text"
                  placeholder="e.g. What are my termination rights?"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={asking}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition disabled:opacity-50 text-sm font-medium"
                >
                  <Send className="w-4 h-4" />
                  {asking ? "Asking..." : "Ask"}
                </button>
              </form>
              {answer && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-1">AI Answer:</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{answer}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Risk Score */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-800">Risk Score</h2>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    data={chartData}
                    startAngle={90}
                    endAngle={90 - (doc.riskScore / 10) * 360}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-center -mt-4">
                <p className="text-5xl font-bold text-gray-900">{doc.riskScore}</p>
                <p className="text-gray-400 text-sm">out of 10</p>
              </div>

              <div className={`flex items-center justify-center gap-2 mt-4 px-4 py-2 rounded-full border ${getRiskColor(doc.riskLevel)}`}>
                {getRiskIcon(doc.riskLevel)}
                <span className="font-semibold">{doc.riskLevel} Risk</span>
              </div>
            </div>

            {/* File Info */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">File Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400">File Name</p>
                  <p className="text-sm text-gray-700 font-medium truncate">{doc.fileName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {doc.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Analyzed On</p>
                  <p className="text-sm text-gray-700">
                    {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Risky Clauses Found</p>
                  <p className="text-sm text-gray-700 font-medium">{doc.riskyClauses?.length || 0}</p>
                </div>
              </div>
              <button
                  onClick={() => generateReport(doc)}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition text-sm">
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}