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
  seal,
  children,
}: {
  title: string;
  description?: string;
  seal?: {
    icon: React.ReactNode;
    label: string;
  };
  children: React.ReactNode;
}) {
  const sectionId = `mb-step-${slugify(title)}`;

  return (
    <section className="mb-section" id={sectionId}>
      <header className="mb-section-header">
        <div className="mb-section-headline">
          <h3>{title}</h3>
          {seal ? (
            <span className="mb-step-seal">
              <span className="mb-step-seal-icon" aria-hidden="true">
                {seal.icon}
              </span>
              {seal.label}
            </span>
          ) : null}
        </div>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="mb-list">{children}</div>
    </section>
  );
}
