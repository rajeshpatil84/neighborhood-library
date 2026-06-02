"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Users, ArrowLeftRight, BarChart3, Library } from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/",            label: "Dashboard",  icon: BarChart3 },
  { href: "/books",       label: "Books",       icon: BookOpen },
  { href: "/members",     label: "Members",     icon: Users },
  { href: "/borrowings",  label: "Borrowings",  icon: ArrowLeftRight },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-64 min-h-screen bg-ink text-parchment flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-library rounded-xl flex items-center justify-center">
            <Library size={18} className="text-ink" />
          </div>
          <div>
            <p className="font-display font-semibold text-base leading-tight">Neighborhood</p>
            <p className="text-xs text-parchment/60 leading-tight">Library System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "sidebar-link",
                active ? "active" : "text-parchment/70 hover:text-parchment"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-white/10">
        <p className="text-xs text-parchment/40">v1.0.0 · Library OS</p>
      </div>
    </aside>
  );
}
