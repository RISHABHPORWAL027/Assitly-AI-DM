import React, { useState } from 'react';
import StaticPageShell from './StaticPageShell';
import { DEVYUG_SOLUTIONS_URL, SUPPORT_EMAIL } from '../lib/siteLinks';

const LAST_UPDATED = 'June 26, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-on-surface mb-3">{title}</h2>
      <div className="space-y-3 text-base">{children}</div>
    </section>
  );
}

export function PrivacyPolicyPage() {
  return (
    <StaticPageShell title="Privacy Policy" subtitle={`Last updated: ${LAST_UPDATED}`}>
      <Section title="1. Introduction">
        <p>
          AssistlyDM (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is operated by Devyug Solutions. This Privacy Policy explains how we
          collect, use, and protect your information when you use our Instagram DM automation platform at AssistlyDM.
        </p>
      </Section>
      <Section title="2. Information we collect">
        <ul className="list-disc pl-5 space-y-2">
          <li>Account information (name, email) when you sign in with Google.</li>
          <li>Instagram business account data connected via Meta&apos;s official OAuth — we never store your Instagram password.</li>
          <li>Automation rules, FAQs, and message templates you configure.</li>
          <li>Lead data (phone numbers, emails) captured through your automations, stored encrypted.</li>
          <li>Usage logs and analytics to improve service reliability.</li>
        </ul>
      </Section>
      <Section title="3. How we use your data">
        <p>We use your data solely to provide automation services, send messages on your behalf through the Instagram Graph API, store leads you collect, and improve product performance. We do not sell your personal data to third parties.</p>
      </Section>
      <Section title="4. Data sharing">
        <p>We share data only with Meta (Instagram Graph API) and infrastructure providers required to operate the service — all under strict data processing agreements.</p>
      </Section>
      <Section title="5. Security">
        <p>All data is encrypted in transit (TLS/SSL) and at rest. Access is role-based with audit logging. OAuth-only Instagram login ensures we never handle your credentials.</p>
      </Section>
      <Section title="6. Your rights">
        <p>You may request access, correction, or deletion of your data by contacting us. You can disconnect Instagram and delete your account from Settings at any time.</p>
      </Section>
      <Section title="7. Contact">
        <p>
          For privacy requests, email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-medium hover:underline">{SUPPORT_EMAIL}</a>.
        </p>
      </Section>
    </StaticPageShell>
  );
}

export function TermsPage() {
  return (
    <StaticPageShell title="Terms & Conditions" subtitle={`Last updated: ${LAST_UPDATED}`}>
      <Section title="1. Acceptance">
        <p>By accessing or using AssistlyDM, you agree to these Terms & Conditions. If you do not agree, please do not use the service.</p>
      </Section>
      <Section title="2. Service description">
        <p>AssistlyDM provides Instagram DM and comment automation through Meta&apos;s official Graph API. You must comply with Instagram&apos;s Terms of Use and Meta Platform Policies at all times.</p>
      </Section>
      <Section title="3. Account responsibilities">
        <ul className="list-disc pl-5 space-y-2">
          <li>You must own or have authorization to manage the Instagram account you connect.</li>
          <li>You are responsible for all messages sent through your automations.</li>
          <li>You must not use AssistlyDM for spam, harassment, or illegal activity.</li>
          <li>Automated messaging must respect user consent and applicable laws (including India&apos;s IT Act and DPDP Act where applicable).</li>
        </ul>
      </Section>
      <Section title="4. Subscription & billing">
        <p>Paid plans are billed monthly. Fees are non-refundable except where required by law. You may cancel anytime from your dashboard; access continues until the end of the billing period.</p>
      </Section>
      <Section title="5. Limitation of liability">
        <p>AssistlyDM is provided &quot;as is.&quot; Devyug Solutions is not liable for indirect damages, account restrictions imposed by Meta, or losses from misconfigured automations. Our total liability is limited to fees paid in the preceding 12 months.</p>
      </Section>
      <Section title="6. Termination">
        <p>We may suspend or terminate accounts that violate these terms or Meta policies. You may stop using the service at any time.</p>
      </Section>
      <Section title="7. Governing law">
        <p>These terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of courts in India.</p>
      </Section>
      <Section title="8. Contact">
        <p>
          Questions about these terms:{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-medium hover:underline">{SUPPORT_EMAIL}</a>.
        </p>
      </Section>
    </StaticPageShell>
  );
}

const LANDING_FAQS = [
  {
    q: 'Is AssistlyDM safe for my Instagram account?',
    a: 'Yes. AssistlyDM is a Meta Business Partner and uses the official Instagram Graph API — the same infrastructure enterprise brands use. We do not use shadow APIs or password scraping.',
  },
  {
    q: 'How quickly can I get started?',
    a: 'Most users connect their Instagram account and launch their first automation in under 10 minutes. OAuth login takes just a few clicks.',
  },
  {
    q: 'What triggers can I automate?',
    a: 'Keyword comments on posts and reels, story mentions, DM keywords, and more. You can chain AI replies, lead forms, payment links, and Calendly booking inside the conversation.',
  },
  {
    q: 'Can I share shop or checkout links in DMs?',
    a: 'Yes. You can send product links, catalog cards, and booking URLs directly inside Instagram DMs to close sales without leaving the conversation.',
  },
  {
    q: 'Can I capture leads outside of Instagram?',
    a: 'Absolutely. Phone numbers and emails collected through automations are stored in your Contacts CRM inside AssistlyDM and can be exported.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'Automations stop at the end of your billing period. Your data remains accessible for 30 days after cancellation, after which it is deleted per our Privacy Policy.',
  },
  {
    q: 'Do you offer support?',
    a: 'All plans include email support. Reach us via the Contact page or at support@assistlyai.co.in.',
  },
];

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <StaticPageShell
      title="Frequently Asked Questions"
      subtitle="Common questions about AssistlyDM, Instagram automation, and billing."
    >
      <div className="space-y-3">
        {LANDING_FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className="bg-white rounded-xl border border-outline-variant/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-on-surface hover:bg-surface-container-low/50 transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <span className="material-symbols-outlined text-primary shrink-0">{isOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-4 text-on-surface-variant border-t border-outline-variant/20 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm pt-4">
        Still have questions?{' '}
        <a href="#contact" className="text-primary font-semibold hover:underline">Contact us</a>.
      </p>
    </StaticPageShell>
  );
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') || '');
    const email = String(data.get('email') || '');
    const subject = String(data.get('subject') || 'AssistlyDM inquiry');
    const message = String(data.get('message') || '');
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <StaticPageShell
      title="Contact Us"
      subtitle="We typically respond within 24 hours on business days."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-outline-variant/30 p-5">
            <p className="text-sm font-bold text-on-surface mb-1">Email</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-medium hover:underline">{SUPPORT_EMAIL}</a>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant/30 p-5">
            <p className="text-sm font-bold text-on-surface mb-1">Built by</p>
            <a href={DEVYUG_SOLUTIONS_URL} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">
              Devyug Solutions
            </a>
          </div>
          <div className="bg-white rounded-xl border border-outline-variant/30 p-5">
            <p className="text-sm font-bold text-on-surface mb-1">Support hours</p>
            <p className="text-sm">Mon–Sat, 9 AM – 9 PM IST</p>
          </div>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <div>
              <p className="font-bold text-on-surface mb-1">Message ready to send</p>
              <p className="text-sm">Your email client should open shortly. If it didn&apos;t, write to us at {SUPPORT_EMAIL}.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-outline-variant/30 p-6 space-y-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-semibold text-on-surface mb-1">Name</label>
              <input
                id="contact-name"
                name="name"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-semibold text-on-surface mb-1">Email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="contact-subject" className="block text-sm font-semibold text-on-surface mb-1">Subject</label>
              <input
                id="contact-subject"
                name="subject"
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-semibold text-on-surface mb-1">Message</label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface resize-y"
                placeholder="Tell us about your use case..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
            >
              Send message
            </button>
          </form>
        )}
      </div>
    </StaticPageShell>
  );
}
