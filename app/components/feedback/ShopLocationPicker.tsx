"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

import { SHOP_LOCATIONS } from "../../lib/feedback-options";

type ShopLocationPickerProps = {
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
};

export function ShopLocationPicker({ value, onChange, invalid = false }: ShopLocationPickerProps) {
  const listId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  function selectedIndex() {
    const index = SHOP_LOCATIONS.findIndex((shop) => shop === value);
    return index >= 0 ? index : 0;
  }

  function openList() {
    setActiveIndex(selectedIndex());
    setOpen(true);
  }

  function selectShop(shop: string) {
    onChange(shop);
    setOpen(false);
    buttonRef.current?.focus();
  }

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

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        id={`${listId}-button`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid}
        aria-activedescendant={open ? activeId : undefined}
        onClick={() => {
          if (open) setOpen(false);
          else openList();
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        className={`flex min-h-11 w-full items-center justify-between rounded-xl border bg-white/75 px-3.5 py-2.5 text-left text-base shadow-[inset_0_1px_2px_rgba(107,33,168,0.06)] outline-none transition ${
          invalid
            ? "border-red-500 text-stone-900 ring-2 ring-red-400/80"
            : "border-[var(--pb-purple)]/20 text-stone-900 focus:border-[var(--pb-purple-light)] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.22)]"
        }`}
      >
        <span className={value ? "font-medium" : "text-stone-400"}>{value || "Select a branch"}</span>
        <span aria-hidden className="text-xs text-[var(--pb-purple)]">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Shop locations"
          className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-white/70 bg-white/95 py-1 text-left shadow-[0_16px_40px_-16px_rgba(107,33,168,0.45)] backdrop-blur-xl"
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
                className={`cursor-pointer px-3.5 py-2.5 text-sm ${
                  active || selected
                    ? "bg-[var(--pb-purple)]/10 font-semibold text-[var(--pb-purple)]"
                    : "text-stone-700"
                }`}
              >
                {shop}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
