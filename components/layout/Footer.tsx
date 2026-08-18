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
            Cricket Atlas helps fans, analysts, and learners explore scorecards, player profiles, team trends, match results, records, and cricket analytics in one clean public website.
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
        <p>Current public pages use real imported scorecards and reference data only.</p>
        <p>Copyright {new Date().getFullYear()} {siteConfig.name}</p>
      </div>
    </footer>
  );
}
