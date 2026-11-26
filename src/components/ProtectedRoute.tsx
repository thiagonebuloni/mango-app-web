import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SupabaseAuthGate } from './SupabaseAuthGate';
import { Sidebar } from './Sidebar';
import { SidebarMenuContext } from './SidebarMenuContext';

export function ProtectedRoute() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <SupabaseAuthGate>
      <SidebarMenuContext.Provider value={openSidebar}>
        <Sidebar open={sidebarOpen} onClose={closeSidebar} />
        <Outlet />
      </SidebarMenuContext.Provider>
    </SupabaseAuthGate>
  );
}