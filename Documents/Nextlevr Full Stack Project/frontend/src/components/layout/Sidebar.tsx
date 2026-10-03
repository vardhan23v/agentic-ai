"use client";

import { JSX } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Target,
  CheckSquare,
  BarChart3,
  Shield,
  UserCog,
  Settings,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_ITEMS: NavItem[] = [
  {
    href: "/admin/users",
    label: "Users",
    icon: UserCog,
    roles: [UserRole.ADMIN],
  },
];

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}

function NavLink({ item, isActive, onNavigate }: NavLinkProps): JSX.Element {
  return (
    <Link
      href={item.href as never}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

interface SidebarContentProps {
  onNavigate?: () => void;
}

export function SidebarContent({ onNavigate }: SidebarContentProps): JSX.Element {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="flex h-full flex-col gap-1 px-3 py-4">
      {/* Main navigation */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {/* Admin section */}
      {isAdmin && (
        <>
          <div className="my-2 border-t border-border" />
          <div className="px-3 py-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              Admin
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {ADMIN_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </>
      )}
    </div>
  );
}

export function Sidebar(): JSX.Element {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
      <SidebarContent />
    </aside>
  );
}
