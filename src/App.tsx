import React, { useEffect, useState } from 'react';
import ApiKeyInput from './ApiKeyInput';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage.local.get("userApiKey", (res) => {
      console.log("Existing API Key:", res.userApiKey);
      setHasKey(!!res.userApiKey);
    });
  }, []);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleKeySaved = () => {
    setHasKey(true);
    setEditMode(false);
    // No need to close here; handled in ApiKeyInput
  };

  return (
    <div style={{ 
      width: '300px',
      minHeight: '250px',
      padding: '20px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#ffffff'
    }}>
      {!hasKey || editMode ? (
        <ApiKeyInput onKeySaved={handleKeySaved} />
      ) : (
        <div style={{ 
          textAlign: 'center',
          padding: '20px',
          width: '100%'
        }}>
          <h2 style={{ 
            color: '#0078d4',
            fontSize: '18px',
            marginBottom: '16px'
          }}>
            API Key already set!
          </h2>
          <div style={{ 
            color: '#555',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            You can now use the extension features.
          </div>
          <button
            onClick={handleEdit}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fff',
              color: '#0078d4',
              border: '1px solid #0078d4',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            Edit API Key
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
