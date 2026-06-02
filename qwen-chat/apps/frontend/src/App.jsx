import { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/Chat/ChatArea';
import SettingsDrawer from './components/Settings/SettingsDrawer';
import HealthBanner from './components/common/HealthBanner';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-800">
      <HealthBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ChatArea onOpenSettings={() => setSettingsOpen(true)} />
        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </div>
  );
}
