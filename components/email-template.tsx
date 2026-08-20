import * as React from "react";

interface EmailTemplateProps {
  fullName: string;
  description: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  fullName,
  description,
}) => (
  <div
    style={{
      fontFamily: "Arial, sans-serif",
      lineHeight: "1.6",
      color: "#333",
      margin: "0",
      padding: "20px",
      backgroundColor: "#f4f4f4",
    }}
  >
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        padding: "30px",
        borderRadius: "8px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ textAlign: "left", marginBottom: "20px" }}>
        {/* You could add a logo here if you have one */}
        <h1
          style={{ color: "#2073c4", margin: "0 0 10px 0", fontSize: "24px" }}
        >
          Notification from Adam (AI Agent)
        </h1>
      </div>

      <h2 style={{ color: "#333", fontSize: "20px", marginBottom: "15px" }}>
        Hi, Product Team!
      </h2>

      <p style={{ marginBottom: "15px" }}>
        This is an automated message from Adam, your Trimble Connect AI
        Assistant.
      </p>

      <p style={{ marginBottom: "15px" }}>
        <strong>{fullName}</strong> has requested that I forward the following
        information to you:
      </p>

      <div
        style={{
          padding: "15px",
          backgroundColor: "#e9f2fa",
          borderRadius: "6px",
          marginBottom: "20px",
          borderLeft: "4px solid #2073c4",
        }}
      >
        <h3
          style={{
            marginTop: "0",
            color: "#1a5a99",
            fontSize: "18px",
            marginBottom: "10px",
          }}
        >
          User&apos;s Message:
        </h3>
        <p style={{ margin: "0", whiteSpace: "pre-wrap" }}>{description}</p>
      </div>

      <p style={{ marginBottom: "20px" }}>
        Please review this information at your earliest convenience.
      </p>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #eee",
          margin: "20px 0",
        }}
      />

      <p style={{ fontSize: "12px", color: "#777", textAlign: "center" }}>
        This email was generated automatically by the AI Assistant in Trimble
        Connect.
      </p>
    </div>
  </div>
);
