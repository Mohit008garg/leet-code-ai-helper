import React, { useState } from 'react';

interface ApiKeyInputProps {
  onKeySaved?: () => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySaved }) => {
  const [apiKey, setApiKey] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleInputChange fired with:", e.target.value);
    setApiKey(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      chrome.storage.local.set({ userApiKey: apiKey }, () => {
      console.log("Saved API Key:", apiKey);
    });
      setApiKey('');
      if (onKeySaved) onKeySaved();
      
    } else {
      alert('Please enter a valid API key.');
    }
  };

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        border: '1px solid #e0e0e0',
        maxWidth: 280,
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          fontSize: '16px',
          marginBottom: '10px',
          color: '#333',
          textAlign: 'center',
        }}
      >
        Enter API Key
      </h2>
      <form onSubmit={handleFormSubmit}>
        <input
          type="text"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e)=>handleInputChange(e)}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '12px',
            border: '1px solid #d1d1d1',
            borderRadius: '4px',
            fontSize: '14px',
            color: '#333',
            backgroundColor: '#f9f9f9',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '9px',
            backgroundColor: '#0078d4',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.2s',
          }}
        >
          Save API Key
        </button>
      </form>
    </div>
  );
};

export default ApiKeyInput;