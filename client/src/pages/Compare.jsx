import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import { ArrowLeft, GitCompare, CheckCircle, XCircle } from "lucide-react";

export default function Compare() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [doc1, setDoc1] = useState("");
  const [doc2, setDoc2] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get("/documents").then(({ data }) => setDocuments(data));
  }, []);

  const handleCompare = async () => {
    if (!doc1 || !doc2) return toast.error("Select two documents");
    if (doc1 === doc2) return toast.error("Select different documents");
    setLoading(true);
    try {
      const { data } = await API.post("/documents/compare", {
        docId1: doc1,
        docId2: doc2,
      });
      setResult(data);
    } catch (err) {
      toast.error("Comparison failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
            <GitCompare className="w-5 h-5 text-blue-500" />
            <h1 className="font-semibold text-gray-800">Compare Documents</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Select Documents */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Two Documents to Compare</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document 1</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={doc1}
                onChange={(e) => setDoc1(e.target.value)}
              >
                <option value="">Select document...</option>
                {documents.map((d) => (
                  <option key={d._id} value={d._id}>{d.fileName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document 2</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={doc2}
                onChange={(e) => setDoc2(e.target.value)}
              >
                <option value="">Select document...</option>
                {documents.map((d) => (
                  <option key={d._id} value={d._id}>{d.fileName}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleCompare}
            disabled={loading}
            className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50"
          >
            <GitCompare className="w-4 h-4" />
            {loading ? "Comparing with AI..." : "Compare Documents"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Verdict */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">AI Verdict</h2>
              <p className="text-blue-700 mb-3">{result.comparison.verdict}</p>
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
                ✅ Recommended: {result.comparison.recommendation}
              </div>
            </div>

            {/* Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { info: result.doc1, comp: result.comparison.doc1 },
                { info: result.doc2, comp: result.comparison.doc2 },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <h3 className="font-semibold text-gray-800 mb-1 truncate">{item.info.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.info.riskLevel === "High" ? "bg-red-100 text-red-700" : item.info.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {item.info.riskLevel} Risk — {item.info.riskScore}/10
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-semibold text-green-700 mb-2">Strengths</p>
                    {item.comp.strengths?.map((s, j) => (
                      <div key={j} className="flex items-start gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{s}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-2">Weaknesses</p>
                    {item.comp.weaknesses?.map((w, j) => (
                      <div key={j} className="flex items-start gap-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}