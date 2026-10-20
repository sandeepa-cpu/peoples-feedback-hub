"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

import { SHOP_LOCATIONS } from "../../lib/feedback-options";

type ShopLocationPickerProps = {
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
};

type MenuBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function ShopLocationPicker({ value, onChange, invalid = false }: ShopLocationPickerProps) {
  const listId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuBox, setMenuBox] = useState<MenuBox | null>(null);

  function selectedIndex() {
    const index = SHOP_LOCATIONS.findIndex((shop) => shop === value);
    return index >= 0 ? index : 0;
  }

  function placeMenu() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
    const spaceAbove = rect.top - gap - 12;
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(140, Math.min(320, openUp ? spaceAbove : spaceBelow));
    setMenuBox({
      top: openUp ? Math.max(8, rect.top - gap - maxHeight) : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }

  function openList() {
    setActiveIndex(selectedIndex());
    placeMenu();
    setOpen(true);
  }

  function selectShop(shop: string) {
    onChange(shop);
    setOpen(false);
    buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function reposition() {
      placeMenu();
    }
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) openList();
      else setActiveIndex((i) => (i + 1) % SHOP_LOCATIONS.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) openList();
      else setActiveIndex((i) => (i - 1 + SHOP_LOCATIONS.length) % SHOP_LOCATIONS.length);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) selectShop(SHOP_LOCATIONS[activeIndex]);
      else openList();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  const activeId = `${listId}-opt-${activeIndex}`;

  const menu =
    open && menuBox
      ? createPortal(
          <ul
            id={listId}
            role="listbox"
            aria-label="Shop locations"
            style={{
              position: "fixed",
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
              maxHeight: menuBox.maxHeight,
              zIndex: 80,
            }}
            className="overflow-auto rounded-xl border border-white/80 bg-white py-1 text-left shadow-[0_16px_40px_-12px_rgba(107,33,168,0.45)]"
          >
            {SHOP_LOCATIONS.map((shop, index) => {
              const selected = value === shop;
              const active = index === activeIndex;
              return (
                <li
                  key={shop}
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectShop(shop);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`cursor-pointer whitespace-normal break-words px-3.5 py-2.5 text-sm leading-snug ${
                    active || selected
                      ? "bg-[var(--pb-purple)]/10 font-semibold text-[var(--pb-purple)]"
                      : "text-stone-800"
                  }`}
                >
                  {shop}
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        id={`${listId}-button`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? activeId : undefined}
        onClick={() => {
          if (open) setOpen(false);
          else openList();
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border bg-white/75 px-3.5 py-2.5 text-left text-base shadow-[inset_0_1px_2px_rgba(107,33,168,0.06)] outline-none transition ${
          invalid
            ? "border-red-500 text-stone-900 ring-2 ring-red-400/80"
            : "border-[var(--pb-purple)]/20 text-stone-900 focus:border-[var(--pb-purple-light)] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.22)]"
        }`}
      >
        <span className={`min-w-0 flex-1 whitespace-normal break-words leading-snug ${value ? "font-medium" : "text-stone-400"}`}>
          {value || "Select a branch"}
        </span>
        <span aria-hidden className="shrink-0 text-xs text-[var(--pb-purple)]">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {menu}
    </div>
  );
}
