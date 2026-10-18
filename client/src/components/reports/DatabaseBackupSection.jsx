import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Database,
  Download,
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HardDrive,
  FileArchive,
  Info,
} from "lucide-react";
import { Modal, Tag } from "antd";
import { backupApi } from "../../api/backupApi";

export const DatabaseBackupSection = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await backupApi.getHistory({ limit: 30 });
      if (res.data) {
        setHistory(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Failed to load backup history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await backupApi.triggerBackup();
      toast.success(
        res.message || "Database backup created and compressed successfully!"
      );
      fetchHistory();
    } catch (err) {
      toast.error(err.message || "Failed to create database backup");
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = async (item) => {
    try {
      toast.info(`Preparing download for ${item.filename}...`);
      await backupApi.downloadBackup(item._id, item.filename);
      toast.success("Download started successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to download backup archive");
    }
  };

  const handleVerifyBackup = async (item) => {
    setVerifyingId(item._id);
    try {
      const res = await backupApi.verifyBackup(item._id);
      setVerificationResult(res.data);
      setShowVerifyModal(true);
    } catch (err) {
      toast.error(err.message || "Integrity verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const formatISTDate = (isoStr) => {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Scheduling Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Manual Backup Trigger Card */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-[#D62828]" />
              <h2 className="text-base font-bold text-[#222222]">
                Database Backup & Snapshot Engine
              </h2>
            </div>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Creates a secure, compressed (GZIP) snapshot of all MongoDB collections (Orders, Payments, KOT, Receipts, Settings, Tables, Menus, Users). Protected against data loss and isolated from live changes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#E5E7EB]">
            <div className="flex items-center space-x-2 text-[11px] text-[#6B7280]">
              <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>SHA-256 Checksum Verified & GZIP Encoded</span>
            </div>

            <button
              type="button"
              onClick={handleCreateBackup}
              disabled={creating}
              className="px-5 py-2.5 bg-[#D62828] hover:bg-[#b91c1c] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <HardDrive className={`w-4 h-4 ${creating ? "animate-spin" : ""}`} />
              <span>{creating ? "Compressing Collections..." : "Create Backup Now"}</span>
            </button>
          </div>
        </div>

        {/* Schedule & Retention Policy Card */}
        <div className="bg-[#FFFBEB] p-5 rounded-xl border border-[#FDE68A] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-1.5 text-[#B45309]">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-wider">
                Automated Schedule
              </h3>
            </div>
            <p className="text-xs font-bold text-[#78350F] mt-1">
              Daily at 23:59 IST
            </p>
            <p className="text-[11px] text-[#92400E] mt-0.5 leading-snug">
              Triggers automatically every night after shop business hours close.
            </p>
          </div>

          <div className="pt-2 border-t border-[#FDE68A]/60">
            <span className="text-[10px] font-bold text-[#78350F] uppercase tracking-wider block">
              Retention Policy
            </span>
            <span className="text-[11px] text-[#92400E]">
              Maintains the latest 30 daily backups. Older archives are automatically pruned to prevent disk bloat.
            </span>
          </div>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#222222]">
              Backup Archive History (Latest 30 Records)
            </h3>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              Secure authorized downloads and integrity verification.
            </p>
          </div>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-1.5 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#222222] transition-colors flex items-center space-x-1"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#6B7280]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D62828]" />
            Loading backup history...
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7EB]">
            <FileArchive className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#222222]">No database backups found</p>
            <p className="text-[11px] text-[#6B7280] mt-1">
              Click &quot;Create Backup Now&quot; above to generate your first complete system snapshot.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[#6B7280] text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3">Date & Time (IST)</th>
                  <th className="py-2.5 px-3">Filename</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Triggered By</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FFFDFD] transition-colors">
                    <td className="py-3 px-3 font-semibold text-[#222222] whitespace-nowrap">
                      {formatISTDate(item.createdAt)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#6B7280]">
                      {item.filename}
                    </td>
                    <td className="py-3 px-3">
                      {item.status === "completed" ? (
                        <Tag color="success" style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}>
                          Completed
                        </Tag>
                      ) : item.status === "failed" ? (
                        <Tag color="error" style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}>
                          Failed
                        </Tag>
                      ) : (
                        <Tag color="warning" style={{ margin: 0, fontWeight: 700, borderRadius: 6 }}>
                          In Progress
                        </Tag>
                      )}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#222222]">
                      {formatFileSize(item.fileSizeBytes)}
                    </td>
                    <td className="py-3 px-3 text-[#6B7280]">
                      {item.isAutomatic ? (
                        <span className="text-[11px] text-[#B45309] font-medium">Daily Cron</span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#222222]">
                          {item.triggeredBy?.username || "Manual"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                      {item.status === "completed" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleVerifyBackup(item)}
                            disabled={verifyingId === item._id}
                            className="px-2.5 py-1 bg-[#FAFAFA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-lg text-[11px] font-bold text-[#222222] transition-colors cursor-pointer"
                            title="Verify archive integrity and document counts"
                          >
                            {verifyingId === item._id ? "Verifying..." : "Verify"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadBackup(item)}
                            className="px-2.5 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] rounded-lg text-[11px] font-bold text-[#D62828] transition-colors cursor-pointer inline-flex items-center space-x-1"
                            title="Download backup archive"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verification Results Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            <span className="text-sm font-bold text-[#222222]">Backup Archive Integrity Verification</span>
          </div>
        }
        open={showVerifyModal}
        onOk={() => setShowVerifyModal(false)}
        onCancel={() => setShowVerifyModal(false)}
        footer={[
          <button
            key="close"
            onClick={() => setShowVerifyModal(false)}
            className="px-4 py-1.5 bg-[#D62828] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Close
          </button>,
        ]}
      >
        {verificationResult && (
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-[#166534]">
              <p className="font-bold">{verificationResult.message}</p>
              <p className="text-[11px] mt-0.5">
                Total Documents Restorable:{" "}
                <span className="font-black">{verificationResult.totalDocuments}</span> across{" "}
                <span className="font-black">{verificationResult.totalCollections}</span> collections.
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[#6B7280] uppercase tracking-wider text-[10px]">
                Archive Details
              </span>
              <p className="font-mono text-[11px] text-[#222222] break-all">
                File: {verificationResult.filename}
              </p>
              <p className="font-mono text-[10px] text-[#6B7280] break-all">
                SHA256: {verificationResult.checksum}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-[#6B7280] uppercase tracking-wider text-[10px]">
                Verified Document Counts by Collection
              </span>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-[#FAFAFA] rounded-lg border border-[#E5E7EB]">
                {Object.entries(verificationResult.verifiedCounts || {}).map(([col, count]) => (
                  <div key={col} className="flex justify-between p-1.5 bg-white rounded border border-[#E5E7EB]">
                    <span className="font-bold text-[#222222] uppercase text-[10px]">{col}</span>
                    <span className="font-mono font-bold text-[#D62828]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Recovery Instructions Callout */}
      <div className="p-4 bg-[#FAFAFA] rounded-xl border border-[#E5E7EB] flex items-start space-x-3 text-xs text-[#6B7280]">
        <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#222222]">Database Disaster Recovery Procedure</p>
          <p className="mt-0.5 leading-relaxed text-[11px]">
            To restore in case of hosting failure: Download the desired <code className="bg-gray-200 px-1 py-0.5 rounded font-mono">.json.gz</code> snapshot from the history list. Unzip it and use the BongPizza restore utility or Mongo import tools to repopulate your target MongoDB Atlas cluster into a test database first before switching production connection strings. Live production data is never overwritten automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseBackupSection;
