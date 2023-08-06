'use client' 

import { GameProvider } from "@/contexts/GameContext"

export default function Layout({ children }) {
    return (
        <GameProvider>
            {children}
        </GameProvider>
    )
  }