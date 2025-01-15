"use client"

import { useEffect, useState} from "react"
import { MoonIcon, SunIcon, SunMoonIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true)
  }, [])

  if(!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={'ghost'} className="focus-visible:ring-0 focus-visible:ring-offset-0" >
          {
            theme === 'system' ? (
              <SunMoonIcon />
            ) : theme === 'dark' ? (
              <MoonIcon />
            ) : <SunIcon />
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Appearence</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={ theme === 'system'} onClick={() => setTheme('system')}>
          System
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={ theme === 'dark'} onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={ theme === 'light'} onClick={() => setTheme('light')}>
          Ligh
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
