import React, { useState } from "react";
import { FiMail, FiCopy, FiCheck, FiExternalLink, FiX, FiHeadphones } from "react-icons/fi";

const HelpSupportModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const supportEmail = "contact@valari.co.in";

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 99999, padding: "1rem"
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative", width: "100%", maxWidth: "420px",
          backgroundColor: "#ffffff", borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          padding: "2rem", textAlign: "center",
          border: "1px solid #f1f5f9",
          fontFamily: "'Outfit','Inter',sans-serif"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "1rem", right: "1rem",
            padding: "6px", borderRadius: "50%", border: "none",
            background: "none", color: "#94a3b8", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background-color 0.2s, color 0.2s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#475569"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
        >
          <FiX style={{ width: "18px", height: "18px" }} />
        </button>

        {/* Icon */}
        <div style={{
          margin: "0 auto 1rem auto", display: "flex",
          height: "56px", width: "56px", alignItems: "center", justifyContent: "center",
          borderRadius: "16px", backgroundColor: "#eef2ff", color: "#4f46e5",
          boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", border: "1px solid #e0e7ff"
        }}>
          <FiHeadphones style={{ width: "26px", height: "26px" }} />
        </div>

        {/* Title & Description */}
        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
          Help &amp; Support
        </h3>
        <p style={{ fontSize: "0.86rem", color: "#64748b", marginBottom: "1.5rem", lineHeight: "1.5" }}>
          Need assistance or facing technical issues with the Language Lab platform? Reach out directly to our support team.
        </p>

        {/* Email Card */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.85rem 1rem", backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ padding: "8px", backgroundColor: "#4f46e5", color: "#ffffff", borderRadius: "8px", display: "flex" }}>
              <FiMail style={{ width: "16px", height: "16px" }} />
            </div>
            <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "#1e293b", userSelect: "all" }}>
              {supportEmail}
            </span>
          </div>
          <button
            onClick={handleCopy}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "6px 12px", fontSize: "0.75rem", fontWeight: 500,
              borderRadius: "8px", backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0", color: "#334155",
              cursor: "pointer", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
              transition: "all 0.15s"
            }}
          >
            {copied ? (
              <>
                <FiCheck style={{ width: "14px", height: "14px", color: "#16a34a" }} />
                <span style={{ color: "#16a34a", fontWeight: 600 }}>Copied!</span>
              </>
            ) : (
              <>
                <FiCopy style={{ width: "14px", height: "14px" }} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "0.65rem 1rem", fontSize: "0.88rem", fontWeight: 600,
              color: "#475569", backgroundColor: "#f1f5f9",
              border: "none", borderRadius: "12px", cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
          >
            Close
          </button>
          <a
            href={"mailto:" + supportEmail + "?subject=Support Request - Language Lab"}
            style={{
              flex: 1, display: "inline-flex", alignItems: "center",
              justifyContent: "center", gap: "6px",
              padding: "0.65rem 1rem", fontSize: "0.88rem", fontWeight: 700,
              color: "#ffffff", backgroundColor: "#4f46e5",
              borderRadius: "12px", textDecoration: "none",
              boxShadow: "0 4px 6px -1px rgba(79,70,229,0.2)",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#4338ca"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#4f46e5"}
          >
            <span>Send Email</span>
            <FiExternalLink style={{ width: "16px", height: "16px" }} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportModal;
