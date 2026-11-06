"use client";
import { createContext, useContext } from "react";
import type { Menu } from "@/lib/menu/types";
import { STATIC_MENU } from "@/lib/menu/data";

const Ctx = createContext<Menu>(STATIC_MENU);
export const MenuProvider = Ctx.Provider;
export const useMenu = () => useContext(Ctx);
