"use client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Settings,
  Info,
  Zap,
  BarChart3,
  Map,
  Bell,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  HardHat,
  Trash2,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import "./sidebar-scrollbar.css"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  userRole: "admin" | "user"
  onRoleChange: (role: "admin" | "user") => void
  currentPage: string
  onPageChange: (page: string) => void
}

export function Sidebar({ isOpen, onToggle, userRole, onRoleChange, currentPage, onPageChange }: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", admin: false },
    { id: "grid", icon: Zap, label: "Grid Status", admin: false },
    { id: "analytics", icon: BarChart3, label: "Analytics", admin: false },
    { id: "map", icon: Map, label: "Grid Map", admin: false },
    { id: "alerts", icon: Bell, label: "Alerts", admin: false },
    { id: "users", icon: Users, label: "User Management", admin: true },
    { id: "grid-assets", icon: HardHat, label: "Grid Assets", admin: true },
    { id: "deleted-assets", icon: Trash2, label: "Deleted Assets", admin: true },
    { id: "settings", icon: Settings, label: "Settings", admin: true },
    { id: "about", icon: Info, label: "About", admin: false },
  ]

  const filteredItems = menuItems.filter((item) => !item.admin || userRole === "admin")

  const SidebarContent = () => (
  <div className="flex flex-col h-full bg-blue-600 dark:bg-background border-r border-blue-700 dark:border-border">
      {/* Header */}
      <div className="p-4 border-b border-blue-700 dark:border-border">
        <div className="flex items-center justify-between">
          {(isOpen || isMobile) && (
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-white dark:text-blue-400" />
              <span className="text-xl font-bold text-white dark:text-white">GridMonitor</span>
            </div>
          )}
          {!isMobile && (
            <Button variant="ghost" size="sm" onClick={onToggle} className="text-white hover:text-white/90 dark:text-slate-400 dark:hover:text-white">
              {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-4 border-b border-blue-700 dark:border-border">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg?height=40&width=40" />
            <AvatarFallback className="bg-blue-600">{userRole === "admin" ? "AD" : "US"}</AvatarFallback>
          </Avatar>
          {(isOpen || isMobile) && (
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-white dark:text-white">
                  {userRole === "admin" ? "Admin User" : "Grid Operator"}
                </p>
                <Badge variant={userRole === "admin" ? "default" : "secondary"} className="text-xs">
                  {userRole === "admin" ? <Shield className="h-3 w-3 mr-1" /> : null}
                  {userRole.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-white/80 dark:text-slate-400">Ethiopian Power Grid</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
  <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <ul className="space-y-2">
          {filteredItems.map((item) => (
            <li key={item.id}>
              <Button
                variant="ghost"
                className={`w-full justify-start ${
                  currentPage === item.id
                    ? "bg-blue-700 text-white dark:bg-accent dark:text-accent-foreground"
                    : "text-white hover:bg-blue-500/40 dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                } ${!(isOpen || isMobile) ? "px-2" : ""}`}
                onClick={() => {
                  onPageChange(item.id)
                  if (isMobile) onToggle()
                }}
              >
                <item.icon className={`h-5 w-5 ${(isOpen || isMobile) ? "mr-3" : ""}`} />
                {(isOpen || isMobile) && item.label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Theme Toggle and Logout */}
      {(isOpen || isMobile) && (
        <div className="p-4 border-t border-blue-700 dark:border-border mt-auto space-y-4">
          <div className="flex items-center justify-between text-sm text-white dark:text-slate-400">
            <span>Theme</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-white hover:text-white/90 dark:text-slate-400 dark:hover:text-white"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          <div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="w-full py-2 bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 md:hidden bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Sheet open={isOpen} onOpenChange={onToggle}>
          <SheetContent side="left" className="p-0 w-64">
            <span className="sr-only"><strong>Sidebar Menu</strong></span>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <div className={`fixed left-0 top-0 h-full transition-all duration-300 z-40 ${isOpen ? "w-64" : "w-16"}`}>
      <SidebarContent />
    </div>
  )
}