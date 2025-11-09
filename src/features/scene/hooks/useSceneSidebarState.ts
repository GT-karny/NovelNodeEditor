import { useCallback, useState } from 'react';

const useSceneSidebarState = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  return { isSidebarOpen, toggleSidebar } as const;
};

export default useSceneSidebarState;
