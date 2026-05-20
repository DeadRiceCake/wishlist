export default function OfflinePage() {
  return (
    <main className="pixel-dots flex min-h-screen items-center justify-center px-4 py-8">
      <section className="pixel-shell fade-up w-full max-w-lg p-6">
        <h1 className="pixel-title text-[14px] leading-relaxed">OFFLINE MODE</h1>
        <p className="mt-4 text-3xl leading-snug">
          인터넷 연결이 끊겨도 최근에 본 위시는 확인할 수 있어요.
        </p>
        <p className="mt-2 text-2xl">연결이 복구되면 자동으로 동기화됩니다.</p>
      </section>
    </main>
  );
}
