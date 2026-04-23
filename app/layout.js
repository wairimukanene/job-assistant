import './globals.css';

export const metadata = {
  title: 'Job Assistant',
  description: 'AI-assisted job search toolkit',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
