import React, { useState } from "react";
import ChatBox from "./ChatBox";

const AiAssistButton: React.FC = () => {
  const [isChatVisible, setIsChatVisible] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsChatVisible(true)}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        AI Assist
      </button>

      {isChatVisible && <ChatBox onClose={() => setIsChatVisible(false)} />}
    </div>
  );
};

export default AiAssistButton;
