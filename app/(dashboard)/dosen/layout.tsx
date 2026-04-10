"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  IconLayoutDashboard,
  IconChecklist,
  IconLogout,
  IconShieldCheck,
  IconMenu2,
  IconBell,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { mockLecturers } from "@/lib/mock-data"

const navItems = [
  {
    label: "Dashboard Dosen",
    href: "/dosen/dashboard",
    icon: IconLayoutDashboard,
  },
]

export default function DosenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const user = mockLecturers[0] // Assuming mock data for lecturer

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 border-r bg-white lg:block dark:bg-slate-900">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <div className="flex items-center space-x-2 text-green-600">
              <IconShieldCheck size={24} />
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Si Perta
              </span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-medium text-white">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {user.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="mt-2 w-full justify-start"
              size="sm"
            >
              <IconLogout size={16} className="mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 lg:hidden"
          >
            <IconMenu2 size={20} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-6">
              <div className="flex items-center space-x-2 text-green-600">
                <IconShieldCheck size={24} />
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Si Perta
                </span>
              </div>
            </div>

            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="border-t p-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm font-medium text-white">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="mt-2 w-full justify-start"
                size="sm"
              >
                <IconLogout size={16} className="mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 lg:pl-0">
        <header className="sticky top-0 z-40 border-b bg-white px-6 py-4 lg:px-8 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                Dashboard Dosen
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <IconSearch
                  size={20}
                  className="absolute top-1/2 left-3 -translate-y-1/2 transform text-slate-400"
                />
                <Input placeholder="Search..." className="w-64 pl-10" />
              </div>
              <Button variant="ghost" size="icon">
                <IconBell size={20} />
              </Button>
              <Button variant="ghost" size="icon">
                <IconSettings size={20} />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
