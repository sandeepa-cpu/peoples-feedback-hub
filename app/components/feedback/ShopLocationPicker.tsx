"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { FEATURED_SHOP, SHOP_LOCATIONS, type ShopLocation } from "../../lib/feedback-options";

type ShopLocationPickerProps = {
  value: string;
  onChange: (next: string) => void;
};

export function ShopLocationPicker({ value, onChange }: ShopLocationPickerProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool: readonly ShopLocation[] = q
      ? SHOP_LOCATIONS.filter((shop) => shop.toLowerCase().includes(q))
      : SHOP_LOCATIONS.filter((shop) => shop !== FEATURED_SHOP);
    return pool;
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function selectShop(shop: string) {
    onChange(value === shop ? "" : shop);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (options.length === 0) return;
      setOpen(true);
      setActiveIndex((i) => (i + 1) % options.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (options.length === 0) return;
      setOpen(true);
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
      return;
    }
    if (event.key === "Enter" && open && options[activeIndex]) {
      event.preventDefault();
      selectShop(options[activeIndex]);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  const selectedOther = value !== "" && value !== FEATURED_SHOP ? value : "";
  const activeId = options[activeIndex] ? `${listId}-opt-${activeIndex}` : undefined;

  return (
    <div className="w-full space-y-3">
      <button
        type="button"
        aria-pressed={value === FEATURED_SHOP}
        onClick={() => onChange(value === FEATURED_SHOP ? "" : FEATURED_SHOP)}
        className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold tracking-wide transition active:scale-[0.98] ${
          value === FEATURED_SHOP
            ? "bg-[var(--pb-purple)] text-white shadow-[0_8px_22px_-8px_rgba(107,33,168,0.7)] ring-2 ring-[var(--pb-yellow)]"
            : "border border-[var(--pb-purple)]/25 bg-white/70 text-[var(--pb-purple)] hover:bg-white"
        }`}
      >
        BMICH
      </button>

      <div className="relative">
        <label htmlFor={`${listId}-search`} className="sr-only">
          Search other branches
        </label>
        <input
          ref={inputRef}
          id={`${listId}-search`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open ? activeId : undefined}
          value={open || query ? query : selectedOther}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={onKeyDown}
          placeholder={selectedOther ? selectedOther : "Search other branches"}
          autoComplete="off"
          className="w-full rounded-xl border border-[var(--pb-purple)]/20 bg-white/70 px-3.5 py-2.5 text-base text-stone-900 shadow-[inset_0_1px_2px_rgba(107,33,168,0.06)] outline-none transition placeholder:text-stone-400 focus:border-[var(--pb-purple-light)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(168,85,247,0.22)]"
        />
        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-label="Other branches"
            className="absolute z-20 mt-1.5 max-h-52 w-full overflow-auto rounded-xl border border-white/70 bg-white/90 py-1 shadow-[0_16px_40px_-16px_rgba(107,33,168,0.45)] backdrop-blur-xl"
          >
            {options.length === 0 ? (
              <li className="px-3 py-2 text-center text-sm text-stone-500">No matching branch</li>
            ) : (
              options.map((shop, index) => {
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
                    className={`cursor-pointer px-3 py-2 text-left text-sm ${
                      active || selected
                        ? "bg-[var(--pb-purple)]/10 font-semibold text-[var(--pb-purple)]"
                        : "text-stone-700"
                    }`}
                  >
                    {shop}
                  </li>
                );
              })
            )}
          </ul>
        ) : null}
      </div>
      {value ? (
        <p className="text-center text-xs font-medium text-[var(--pb-purple)]">Selected: {value}</p>
      ) : (
        <p className="text-center text-[0.65rem] text-stone-500">Optional — pick BMICH or search a branch.</p>
      )}
    </div>
  );
}
