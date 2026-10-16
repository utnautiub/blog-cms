import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-4 border-x px-4 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Không tìm thấy trang</h1>
      <Link href="/" className="text-sm underline underline-offset-4">
        Về trang chủ
      </Link>
    </div>
  );
}
