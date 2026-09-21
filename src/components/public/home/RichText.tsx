import React from "react";

// Renders admin-entered text where **word** is bold (no HTML is ever injected).
export default function RichText({
  value,
  strongClassName = "font-semibold",
}: {
  value: string;
  strongClassName?: string;
}) {
  const parts = value.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className={strongClassName}>
            {part}
          </strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}
