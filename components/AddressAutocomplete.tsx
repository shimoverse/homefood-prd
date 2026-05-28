"use client";

import { useEffect, useId, useRef, useState } from "react";

type AddressSuggestion = {
  id: string;
  label: string;
  value: string;
  city: string;
  lat: string;
  lon: string;
};

type AddressAutocompleteProps = {
  label: string;
  value: string;
  onChange: (value: string, suggestion?: AddressSuggestion) => void;
  placeholder?: string;
};

export function AddressAutocomplete({ label, value, onChange, placeholder }: AddressAutocompleteProps) {
  const listboxId = useId();
  const wrapperRef = useRef<HTMLLabelElement | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/address-search?q=" + encodeURIComponent(query), {
          signal: controller.signal
        });
        const payload = (await response.json()) as { suggestions?: AddressSuggestion[] };
        const nextSuggestions = payload.suggestions ?? [];
        setSuggestions(nextSuggestions);
        setOpen(nextSuggestions.length > 0);
        setActiveIndex(nextSuggestions.length > 0 ? 0 : -1);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestions([]);
          setOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function choose(suggestion: AddressSuggestion) {
    onChange(suggestion.value, suggestion);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <label className="addressAutocomplete" ref={wrapperRef}>
      {label}
      <input
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        role="combobox"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setOpen(suggestions.length > 0)}
        onKeyDown={(event) => {
          if (!open && event.key === "ArrowDown" && suggestions.length > 0) {
            setOpen(true);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
          }
          if (event.key === "Enter" && open && activeIndex >= 0) {
            event.preventDefault();
            choose(suggestions[activeIndex]);
          }
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
      />
      {loading && <span className="addressLoading">Searching OpenStreetMap...</span>}
      {open && (
        <div className="addressMenu" id={listboxId} role="listbox">
          {suggestions.map((suggestion, index) => (
            <button
              aria-selected={index === activeIndex}
              className={index === activeIndex ? "active" : ""}
              key={suggestion.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(suggestion)}
              role="option"
              type="button"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </label>
  );
}
