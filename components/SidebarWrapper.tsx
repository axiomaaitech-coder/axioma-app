"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function SidebarWrapper() {
  const pathname = usePathname();
  
  // Não mostra sidebar na tela de login
  if (pathname === "/") return null;
  
  return <Sidebar/>;
}