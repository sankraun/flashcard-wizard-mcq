import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SettingsMenu = ({ onSignOut }: { onSignOut: () => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="hover-scale">
        <Settings className="w-5 h-5" />
        <span className="sr-only">Settings</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={onSignOut} className="text-red-600">
        <LogOut className="w-4 h-4 mr-2" /> Sign Out
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default SettingsMenu;
