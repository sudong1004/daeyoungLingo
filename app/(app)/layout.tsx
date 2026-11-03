import Link from "next/link";
import { requireAuth } from "@/lib/auth";

// 빌드 시점에 DB(Supabase)를 호출하지 않도록 항상 요청 시점에 렌더링
export const dynamic = "force-dynamic";

const tabs = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/study", label: "학습", icon: "✏️" },
  { href: "/talk", label: "회화", icon: "💬" },
  { href: "/words", label: "단어장", icon: "📖" },
  { href: "/stats", label: "기록", icon: "📊" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col pb-24">
      <div className="flex-1 px-5 pt-6">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
        <div className="mx-auto flex max-w-xl">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-stone-600 active:bg-stone-100 dark:text-stone-300 dark:active:bg-stone-900"
            >
              <span className="text-xl">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
