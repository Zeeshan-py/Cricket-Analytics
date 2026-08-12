import Link from "next/link";
import { footerGroups } from "@/lib/routes";
import { siteConfig } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link className="brand-link brand-link--footer" href="/">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="brand-name">{siteConfig.name}</span>
          </Link>
          <p>{siteConfig.description}</p>
          <p className="footer-note">
            Public cricket statistics, editorial analysis, and dataset-backed pages. Advertising,
            analytics, privacy, and consent surfaces can be added later without changing the core layout.
          </p>
        </div>

        {footerGroups.map((group) => (
          <nav key={group.title} aria-label={`${group.title} links`} className="footer-links">
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <Link key={`${group.title}-${link.href}-${link.label}`} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="container footer-bottom">
        <p>Demo foundation. Replace mock content with verified cricket datasets before publication.</p>
        <p>Copyright {new Date().getFullYear()} {siteConfig.name}</p>
      </div>
    </footer>
  );
}
