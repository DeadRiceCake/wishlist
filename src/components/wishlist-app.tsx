"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Wish } from "@/lib/supabase/types";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DEMO_WISHES: Wish[] = [
  {
    id: "demo-1",
    title: "비 오는 날 드라이브",
    memo: "플레이리스트 같이 만들기",
    status: "WANT",
    priority: 2,
    visibility: "COUPLE",
    updated_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "토요일 브런치 투어",
    memo: "파스텔톤 인테리어 카페 우선",
    status: "PLANNED",
    priority: 1,
    visibility: "COUPLE",
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

const STATUS_LABEL: Record<Wish["status"], string> = {
  WANT: "하고싶음",
  PLANNED: "계획중",
  DONE: "완료",
  ARCHIVED: "보관",
};

export function WishlistApp() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const isDemoMode = !supabase;

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const loadWishes = async () => {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setWishes(DEMO_WISHES);
        setLoading(false);
        return;
      }

      const { data, error: loadError } = await supabase
        .from("wishes")
        .select("id, title, memo, status, priority, visibility, updated_at")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (loadError) {
        setError("Supabase 조회에 실패했어요. .env 값과 RLS 정책을 확인해주세요.");
        setWishes(DEMO_WISHES);
      } else {
        setWishes((data ?? []) as Wish[]);
      }

      setLoading(false);
    };

    void loadWishes();
  }, [supabase]);

  const handleInstall = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const addWish = async () => {
    if (!title.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    if (!supabase) {
      const newWish: Wish = {
        id: crypto.randomUUID(),
        title: title.trim(),
        memo: memo.trim(),
        status: "WANT",
        priority: 2,
        visibility: "COUPLE",
        updated_at: new Date().toISOString(),
      };
      setWishes((prev) => [newWish, ...prev]);
      setTitle("");
      setMemo("");
      setSubmitting(false);
      return;
    }

    const defaultCoupleId = process.env.NEXT_PUBLIC_DEFAULT_COUPLE_ID;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!defaultCoupleId || !user) {
      setError("로그인과 NEXT_PUBLIC_DEFAULT_COUPLE_ID 설정이 필요해요.");
      setSubmitting(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("wishes")
      .insert({
        title: title.trim(),
        memo: memo.trim(),
        status: "WANT",
        priority: 2,
        visibility: "COUPLE",
        couple_id: defaultCoupleId,
        owner_id: user.id,
      })
      .select("id, title, memo, status, priority, visibility, updated_at")
      .single();

    if (insertError) {
      setError("위시 저장에 실패했어요. RLS 정책 또는 couple_id를 확인해주세요.");
      setSubmitting(false);
      return;
    }

    setWishes((prev) => [data as Wish, ...prev]);
    setTitle("");
    setMemo("");
    setSubmitting(false);
  };

  return (
    <main className="pixel-dots flex min-h-screen w-full items-start justify-center px-4 py-6 md:py-10">
      <section className="pixel-shell fade-up w-full max-w-3xl p-4 md:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="pixel-title text-[11px] leading-relaxed">WISH PIXEL</p>
            <h1 className="mt-2 text-4xl leading-none md:text-5xl">우리의 하고싶은 일</h1>
            <p className="mt-2 text-2xl text-[#33553f]">
              커플끼리 위시를 공유하고, 모바일에서 앱처럼 바로 쓰세요.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="pixel-panel px-3 py-1 text-xl text-[#33553f]">
              {isDemoMode ? "DEMO" : "LIVE"}
            </span>
            {installPrompt ? (
              <button className="pixel-button px-3 py-2 text-xl" onClick={handleInstall}>
                앱 설치
              </button>
            ) : null}
          </div>
        </header>

        <section className="pixel-panel mt-5 p-4">
          <p className="pixel-title text-[10px] leading-relaxed">ADD WISH</p>
          <div className="mt-3 grid gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border-[3px] border-[#243127] bg-white px-3 py-2 text-2xl outline-none"
              placeholder="예: 한강 피크닉"
              maxLength={120}
            />
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="min-h-24 w-full rounded-md border-[3px] border-[#243127] bg-white px-3 py-2 text-2xl outline-none"
              placeholder="메모를 남겨보세요"
              maxLength={500}
            />
            <button
              className="pixel-button w-fit px-4 py-2 text-2xl disabled:opacity-60"
              onClick={() => void addWish()}
              disabled={submitting}
            >
              {submitting ? "저장중..." : "위시 추가"}
            </button>
            {error ? <p className="text-xl text-[#844040]">{error}</p> : null}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="pixel-title text-[10px] leading-relaxed">WISH FEED</p>
            <p className="text-xl text-[#33553f]">총 {wishes.length}개</p>
          </div>

          {loading ? <p className="text-2xl">불러오는 중...</p> : null}

          <div className="grid gap-3">
            {wishes.map((wish) => (
              <article key={wish.id} className="pixel-panel fade-up p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-3xl leading-tight">{wish.title}</h2>
                  <span className="rounded-md border-2 border-[#243127] bg-white px-2 py-1 text-xl">
                    {STATUS_LABEL[wish.status]}
                  </span>
                </div>
                {wish.memo ? <p className="mt-2 text-2xl text-[#33553f]">{wish.memo}</p> : null}
                <p className="mt-2 text-xl text-[#3e6149]">
                  우선순위 {wish.priority} · 공개범위 {wish.visibility}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
