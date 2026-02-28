import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * CustomSelect — รองรับ props เหมือน <select> แบบ basic:
 *   value, onChange(value), options=[{value, label}],
 *   placeholder, style (wrapper style override)
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = "เลือก...", style = {} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label ?? placeholder;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", ...style }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          border: `1.5px solid ${open ? "var(--primary-orange)" : "var(--border-color)"}`,
          borderRadius: 12,
          background: "#fff",
          cursor: "pointer",
          fontSize: 14,
          fontFamily: "inherit",
          color: value ? "#19191C" : "#9ca3af",
          boxShadow: open ? "0 0 0 3px rgba(237,100,45,0.1)" : "none",
          transition: "border-color 0.2s, box-shadow 0.2s",
          userSelect: "none",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            marginLeft: 8,
            color: "#9ca3af",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </div>

      {/* Dropdown List */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1.5px solid var(--border-color)",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 10000,
            maxHeight: 220,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  padding: "11px 16px",
                  fontSize: 14,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  background: isSelected ? "#FFF1EB" : "transparent",
                  color: isSelected ? "var(--primary-orange)" : "#19191C",
                  fontWeight: isSelected ? 700 : 400,
                  transition: "background 0.15s",
                  borderRadius: 8,
                  margin: "2px 4px",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = "transparent";
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
