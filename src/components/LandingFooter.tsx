import React from 'react';
// Logo served from public folder
import { DEVYUG_PRODUCTS, DEVYUG_SOLUTIONS_URL, LEGAL_LINKS } from '../lib/siteLinks';

export default function LandingFooter() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/30 py-20 px-lg relative z-10">
      <div className="max-w-container-max mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start mb-20 gap-xl">
        <div className="max-w-xs">
          <a href="#landing" className="flex items-center gap-sm mb-md">
            <img alt="AssistlyDM Logo" className="h-10 w-10 rounded-lg object-cover" src="/logo.jpeg" />
            <span className="font-headline-md font-bold text-on-surface">AssistlyDM</span>
          </a>
          <p className="text-on-surface-variant leading-relaxed font-medium">
            Empowering Indian creators and brands to scale through world-class Instagram automation. Built for speed, trust, and growth.
          </p>
            <p className="text-xs text-on-surface-variant text-center mt-2">Trust &amp; Compliance<br/>Built on official partnerships, not workarounds</p>
        </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-xl w-full md:w-auto">
            <div>
              <h4 className="font-bold mb-md text-on-surface">Product</h4>
              <ul className="space-y-sm">
                {['Features', 'Integrations', 'Pricing'].map((l) => (
                  <li key={l}>
                    <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium" href="#landing">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-md text-on-surface">Our other products</h4>
              <ul className="space-y-sm">
                {DEVYUG_PRODUCTS.map((product) => (
                  <li key={product.name}>
                    <a
                      className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium"
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {product.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="pt-10 border-t border-outline-variant/20 flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center gap-md w-full">
  <p className="text-xs text-on-surface-variant font-medium">© 2026 AssistlyDM. Proudly built for the global creator economy.</p>
  <div className="flex items-center gap-md">
    <span className="text-xs font-bold text-on-surface-variant">System Status: </span>
    <span className="flex items-center gap-1 text-xs font-bold text-success-whatsapp">
      <span className="w-2 h-2 rounded-full bg-success-whatsapp animate-pulse" />
      All Systems Operational
    </span>
  </div>
</div>
        </div>
      </div>
    </footer>
  );
}
