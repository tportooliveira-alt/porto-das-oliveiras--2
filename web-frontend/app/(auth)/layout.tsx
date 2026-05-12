export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10 bg-canvas">
      <div className="w-full max-w-md border-thick border-border p-8">
        {children}
      </div>
    </div>
  );
}
