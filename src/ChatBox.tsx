import React, { useState } from "react";
import { buildSystemPrompt } from "./constants/prompts";
import { log, errorLog } from "./utils/logger";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// ✅ Bridge helper: request Monaco solution from injected bridge.js
/**
 * DOM-only approach to read as much of the Monaco editor content as possible.
 * It temporarily scrolls the Monaco scrollable element to force rendering of different chunks,
 * collects .view-line text, deduplicates, and restores the original scroll position.
 *
 * NOTE: this will scroll the editor internally (not the whole page). It tries to be fast
 * and restores the editor to the original scroll position afterwards.
 */
const getUserSolution = async (): Promise<string> => {
  try {
    // Primary container that holds the editor's scrollable area
    const container = document.querySelector<HTMLElement>(".monaco-scrollable-element.editor-scrollable");

    // Helper to read visible lines right now
    const readVisibleLines = (): string[] => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(".view-lines .view-line"));
      if (!nodes.length) return [];
      return nodes.map(n => {
        // textContent preserves indentation; replace NBSP with normal space
        return (n.textContent || "").replace(/\u00A0/g, " ");
      });
    };

    // If no container or no lines, do a single-pass read and return
    if (!container) {
      const single = readVisibleLines().join("\n").trim();
      return single;
    }

    // Save original editor scrollTop so we can restore later
    const originalScrollTop = container.scrollTop;

    // Parameters: tune these if needed
    const clientHeight = container.clientHeight || container.offsetHeight || 200;
    const scrollHeight = container.scrollHeight || clientHeight;
    const approxSteps = Math.ceil(scrollHeight / clientHeight);
    const maxSteps = Math.min(40, approxSteps); // safety cap
    const delayMs = 80; // wait after each scroll for Monaco to render

    const seen = new Set<string>();
    const ordered: string[] = [];

    // If only one "page" visible, just capture once
    if (maxSteps <= 1) {
      const lines = readVisibleLines();
      for (const l of lines) {
        if (!seen.has(l)) { seen.add(l); ordered.push(l); }
      }
      return ordered.join("\n").trim();
    }

    // Iterate scrolling from top to bottom collecting visible lines
    for (let i = 0; i < maxSteps; i++) {
      // compute scroll position (clamped)
      const pos = Math.min(i * clientHeight, scrollHeight - clientHeight);
      container.scrollTop = pos;

      // small wait so Monaco re-renders
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, delayMs));

      const lines = readVisibleLines();
      for (const l of lines) {
        if (!seen.has(l)) {
          seen.add(l);
          ordered.push(l);
        }
      }
    }

    // restore original scrollTop
    container.scrollTop = originalScrollTop;

    // Trim leading/trailing blank lines
    const code = ordered.join("\n").trim();
    return code;
  } catch (err) {
    console.error("[AI Assist] getUserSolution (DOM) error:", err);
    // fallback: try single-pass read
    try {
      const single = Array.from(document.querySelectorAll<HTMLElement>(".view-lines .view-line"))
        .map(n => (n.textContent || "").replace(/\u00A0/g, " "))
        .join("\n")
        .trim();
      return single;
    } catch (e) {
      return "";
    }
  }
};


const ChatBox: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const problemStatement =
      document.querySelector(".elfjS")?.textContent || "Unknown problem";

    const userLanguage =
      document.querySelector("button.rounded.items-center")?.textContent ||
      "Unknown language";

    const userSolution = await getUserSolution();
    log("📌 Problem:", problemStatement);
    log("💻 Language:", userLanguage);
    log("📝 User Solution (first 200 chars):", userSolution.slice(0, 200));

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { userApiKey } = await chrome.storage.local.get("userApiKey");

      const systemPrompt = buildSystemPrompt(
        problemStatement,
        userLanguage,
        userSolution
      );
      log("🛠 buildSystemPrompt", systemPrompt);

      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }, { text: input }],
          },
        ],
      };

      log("🔼 Sending request to Gemini API:", payload);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${userApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      log("🔽 Gemini response:", data);

      const aiText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No response from AI.";

      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
    } catch (error) {
      errorLog("❌ Error fetching AI response:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error contacting AI." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "70px",
        right: "20px",
        width: "300px",
        height: "400px",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        zIndex: 10001,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: "#007bff",
          color: "#fff",
          padding: "10px",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: "bold",
        }}
      >
        AI Assist
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          ✖
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: "10px",
          overflowY: "auto",
          fontSize: "14px",
          color: "#333",
        }}
      >
        {messages.length === 0 && !loading && (
          <div
            style={{
              color: "#888",
              fontStyle: "italic",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            👋 Hi! Ask me anything about this problem or your code to get
            started.
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: "8px",
              padding: "6px 10px",
              borderRadius: "6px",
              backgroundColor: msg.role === "user" ? "#e1f5fe" : "#f1f1f1",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <strong>{msg.role === "user" ? "You" : "AI"}: </strong>
            {msg.content}
          </div>
        ))}
        {loading && <p style={{ color: "#888" }}>AI is typing...</p>}
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px",
          borderTop: "1px solid #ccc",
          display: "flex",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: "6px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            marginRight: "6px",
            fontSize: "14px",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: "6px 12px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
