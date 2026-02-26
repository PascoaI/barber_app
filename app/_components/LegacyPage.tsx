import Script from 'next/script';

export default function LegacyPage({ bodyHtml }: { bodyHtml: string }) {
  return (
    <>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <Script src="/script.js" strategy="afterInteractive" />
    </>
  );
}
