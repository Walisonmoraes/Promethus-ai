import React from "react";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const sectionId = `mb-step-${slugify(title)}`;

  return (
    <section className="mb-section" id={sectionId}>
      <header>
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="mb-list">{children}</div>
    </section>
  );
}
