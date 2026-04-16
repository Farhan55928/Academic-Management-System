export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-header anim-fade-up">
      <div className="page-header-top">
        <div>
          {eyebrow && <p className="page-header-eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {subtitle && <p className="page-header-sub">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2 items-center">{actions}</div>}
      </div>
      <hr className="page-header-rule" />
    </div>
  );
}
