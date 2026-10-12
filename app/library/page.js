"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

const statuses = [
  { value: "want_to_read", label: "읽고 싶은 책", icon: "☆" },
  { value: "reading", label: "읽는 중", icon: "◷" },
  { value: "read", label: "읽은 책", icon: "✓" },
];

const filters = [
  { value: "all", label: "전체" },
  ...statuses.map(({ value, label }) => ({ value, label })),
];

export default function LibraryPage() {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState(isSupabaseConfigured ? null : {
    type: "error",
    text: "Supabase 연결 정보가 없습니다. .env.local을 설정한 뒤 서버를 다시 시작해 주세요.",
  });

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    async function fetchBooks() {
      try {
        const { data, error } = await supabase
          .from("books")
          .select("id, google_id, title, authors, publisher, published_date, thumbnail, status, notes")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (active) {
          setBooks(data || []);
          setMessage(null);
        }
      } catch (error) {
        if (active) {
          setMessage({
            type: "error",
            text: `책장을 불러오지 못했습니다: ${error.message || "네트워크 연결을 확인해 주세요."} (테이블 컬럼과 Supabase SELECT 정책을 확인해 주세요.)`,
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchBooks();
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => ({
    all: books.length,
    want_to_read: books.filter((book) => book.status === "want_to_read").length,
    reading: books.filter((book) => book.status === "reading").length,
    read: books.filter((book) => book.status === "read").length,
  }), [books]);

  const visibleBooks = filter === "all"
    ? books
    : books.filter((book) => book.status === filter);

  async function updateStatus(book, status) {
    if (!supabase) return;
    const previousStatus = book.status;
    setBooks((current) => current.map((item) =>
      item.id === book.id ? { ...item, status } : item
    ));
    setBusyId(book.id);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("books")
        .update({ status })
        .eq("id", book.id)
        .select("id")
        .single();

      if (error) throw error;
    } catch (error) {
      setBooks((current) => current.map((item) =>
        item.id === book.id ? { ...item, status: previousStatus } : item
      ));
      setMessage({
        type: "error",
        text: `독서 상태를 저장하지 못했습니다: ${error.message || "네트워크 연결을 확인해 주세요."} (Supabase UPDATE 정책을 확인해 주세요.)`,
      });
    } finally {
      setBusyId("");
    }
  }

  async function deleteBook(book) {
    const confirmed = window.confirm(`"${book.title}"을(를) 내 책장에서 삭제할까요?`);
    if (!confirmed || !supabase) return;

    setBusyId(book.id);
    setMessage(null);
    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", book.id)
        .select("id")
        .single();

      if (error) throw error;
      setBooks((current) => current.filter((item) => item.id !== book.id));
      setMessage({ type: "success", text: "책을 내 책장에서 삭제했습니다." });
    } catch (error) {
      setMessage({
        type: "error",
        text: `책을 삭제하지 못했습니다: ${error.message || "네트워크 연결을 확인해 주세요."} (Supabase DELETE 정책을 확인해 주세요.)`,
      });
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/">BOOK<span>LOG</span></Link>
          <nav className="nav-links" aria-label="주요 메뉴">
            <Link className="nav-link" href="/">홈</Link>
            <Link className="nav-link active" href="/library">내 서재</Link>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <p className="eyebrow" style={{ color: "#4f46e5" }}>MY READING SPACE</p>
        <h1 className="page-title">나의 서재</h1>
        <p className="muted">책의 상태를 바꾸고, 나만의 독서 흐름을 확인해 보세요.</p>

        <section className="stats-grid" aria-label="독서 통계">
          <div className="stat-card"><span>전체 도서</span><strong>{counts.all}</strong></div>
          <div className="stat-card"><span>읽는 중</span><strong>{counts.reading}</strong></div>
          <div className="stat-card"><span>읽은 책</span><strong>{counts.read}</strong></div>
        </section>

        {message && (
          <p className={`notice ${message.type === "error" ? "error" : message.type === "success" ? "success" : ""}`} role="status">
            {message.text}
          </p>
        )}

        <div className="filter-row" aria-label="독서 상태 필터">
          {filters.map((item) => (
            <button
              className={`filter-button ${filter === item.value ? "selected" : ""}`}
              type="button"
              key={item.value}
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
            >
              {item.label}{item.value === "all" ? ` ${counts.all}` : ` ${counts[item.value]}`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state" role="status">책장을 불러오는 중입니다...</div>
        ) : visibleBooks.length === 0 ? (
          <div className="empty-state">
            <strong>{books.length === 0 ? "아직 책장에 담긴 책이 없어요." : "이 상태의 책이 없습니다."}</strong>
            <span>홈에서 읽고 싶은 책을 검색해 책장에 추가해 보세요.</span>
            <div style={{ marginTop: 18 }}><Link className="primary-button" href="/">책 검색하기</Link></div>
          </div>
        ) : (
          <div className="book-grid">
            {visibleBooks.map((book) => {
              const status = statuses.find((item) => item.value === book.status) || statuses[0];
              return (
                <article className="book-card library-card" key={book.id}>
                  <div className="book-cover-wrap">
                    {book.thumbnail ? (
                      <Image
                        className="book-cover"
                        src={book.thumbnail}
                        alt={`${book.title} 표지`}
                        width={180}
                        height={245}
                        sizes="(max-width: 640px) 45vw, 180px"
                      />
                    ) : (
                      <div className="cover-placeholder" aria-label="표지 없음">▤</div>
                    )}
                  </div>
                  <div className="book-card-body">
                    <span className={`status-badge status-${status.value}`}>{status.icon} {status.label}</span>
                    <h3>{book.title}</h3>
                    <p className="book-meta">
                      {book.authors || "저자 정보 없음"}
                      {book.publisher ? <><br />{book.publisher}</> : null}
                      {book.published_date ? <><br />{book.published_date}</> : null}
                    </p>
                    <label className="muted" htmlFor={`status-${book.id}`}>독서 상태</label>
                    <select
                      className="status-select"
                      id={`status-${book.id}`}
                      value={status.value}
                      disabled={busyId === book.id}
                      onChange={(event) => updateStatus(book, event.target.value)}
                    >
                      {statuses.map((item) => (
                        <option value={item.value} key={item.value}>{item.label}</option>
                      ))}
                    </select>
                    <button
                      className="danger-button"
                      type="button"
                      disabled={busyId === book.id}
                      onClick={() => deleteBook(book)}
                    >
                      {busyId === book.id ? "처리 중..." : "책 삭제"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <footer className="footer">BOOKLOG · 나만의 독서 기록</footer>
    </div>
  );
}
