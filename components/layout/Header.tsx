"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon } from "@/components/ui/Icon";
import { SearchBar } from "@/components/ui/SearchBar";
import { primaryNav } from "@/lib/routes";
import { siteConfig } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand-link" href="/" aria-label={`${siteConfig.name} home`}>
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">{siteConfig.name}</span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-search">
          <SearchBar id="global-search" />
        </div>

        <button
          className="icon-button mobile-menu-button"
          type="button"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div id="mobile-navigation" className={`mobile-nav-panel ${isOpen ? "is-open" : ""}`}>
        <div className="container mobile-nav-inner">
          <SearchBar id="mobile-search" />
          <nav aria-label="Mobile navigation">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
