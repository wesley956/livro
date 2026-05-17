import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Reader from './components/Reader';

type Screen = 'dashboard' | 'reader';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('dashboard');

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {screen === 'dashboard' ? (
        <Dashboard onReadBook={() => setScreen('reader')} />
      ) : (
        <Reader onBack={() => setScreen('dashboard')} />
      )}
    </div>
  );
};

export default App;
