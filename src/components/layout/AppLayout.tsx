import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../AppSidebar';
const AppLayout = () => {
  return <div className="flex h-screen w-full">
      <AppSidebar activeTab="" onTabChange={() => {}} />
      <SidebarInset className="flex-1">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-0 py-0 mx-[123px]">
          <SidebarTrigger className="-ml-1" />
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </div>;
};
export default AppLayout;