import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export function useMaintenance() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  // Only check if user is not daniel08
  const currentUser = localStorage.getItem('currentUser');
  const userData = currentUser ? JSON.parse(currentUser) : null;
  const isAdmin = userData?.username === 'daniel08';

  // Query system config, but only if not admin
  const { data: systemConfig } = useQuery<SystemConfig>({
    queryKey: ['/api/admin/system/config'],
    enabled: !isAdmin,
    refetchInterval: 30000, // Check every 30 seconds
    retry: false,
    staleTime: 0, // Always fresh
  });

  useEffect(() => {
    if (!isAdmin && systemConfig) {
      setIsMaintenanceMode(systemConfig.maintenanceMode);
      setMaintenanceMessage(systemConfig.maintenanceMessage);
    } else if (isAdmin) {
      setIsMaintenanceMode(false);
      setMaintenanceMessage("");
    }
  }, [systemConfig, isAdmin]);

  return {
    isMaintenanceMode,
    maintenanceMessage,
    isAdmin
  };
}