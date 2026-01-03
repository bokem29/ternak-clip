import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
    children: ReactNode;
}

interface SidebarContextType {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within AdminLayout");
    }
    return context;
};

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem("adminSidebarCollapsed");
        return saved === "true";
    });

    useEffect(() => {
        localStorage.setItem("adminSidebarCollapsed", String(isCollapsed));
    }, [isCollapsed]);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
        <div className="flex h-screen overflow-hidden text-sm bg-[#050505] text-zinc-200">
            <AdminSidebar />
            <main className="flex-1 flex flex-col relative overflow-hidden bg-[#050505]">
                {children}
            </main>
        </div>
        </SidebarContext.Provider>
    );
};


export default AdminLayout;
